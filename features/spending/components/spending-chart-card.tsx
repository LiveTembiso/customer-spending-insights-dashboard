import { Skeleton } from "@/components/ui/skeleton";
import { NativeSelect } from "@/components/ui/native-select";
import { formatMonthLong, formatMonthShort } from "@/lib/format";
import { cn } from "@/lib/utils";

import { axisMax, STRIPES } from "../charts";
import { formatMetric, metricValue, monthStats } from "../insights";
import type { MonthlyTrend } from "../schemas";
import {
  METRIC_LABELS,
  METRICS,
  type Metric,
  MONTH_CHOICES,
  type MonthChoice,
} from "../view";

const TITLE_ID = "spending-chart-title";

// How often a month is labelled, on a phone and from `sm` up.
const LABEL_EVERY: Record<MonthChoice, [phone: number, wide: number]> = {
  6: [1, 1],
  12: [2, 1],
  24: [4, 2],
};

const GAPS: Record<MonthChoice, string> = {
  6: "gap-2 sm:gap-6",
  12: "gap-1.5 sm:gap-3",
  24: "gap-0.5 sm:gap-1.5",
};

const monthYear = (month: string) =>
  `${formatMonthShort(month)} ${month.slice(0, 4)}`;

interface SpendingChartCardProps {
  trends?: MonthlyTrend[];
  months: MonthChoice;
  metric: Metric;
  onChange: (change: { months?: MonthChoice; metric?: Metric }) => void;
  stale?: boolean;
}

export function SpendingChartCard({
  trends,
  months,
  metric,
  onChange,
  stale,
}: SpendingChartCardProps) {
  return (
    <section
      aria-labelledby={TITLE_ID}
      className="flex min-w-0 flex-col gap-5 rounded-[22px] bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={TITLE_ID} className="text-lg font-bold">
            Monthly spending
          </h2>
          {trends && <Description trends={trends} metric={metric} />}
        </div>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="chart-metric"
              className="text-xs font-semibold text-muted-foreground"
            >
              Show
            </label>
            <NativeSelect
              id="chart-metric"
              value={metric}
              onChange={(event) =>
                onChange({ metric: event.target.value as Metric })
              }
            >
              {METRICS.map((option) => (
                <option key={option} value={option}>
                  {METRIC_LABELS[option]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="chart-months"
              className="text-xs font-semibold text-muted-foreground"
            >
              Months
            </label>
            <NativeSelect
              id="chart-months"
              value={months}
              onChange={(event) =>
                onChange({ months: Number(event.target.value) as MonthChoice })
              }
            >
              {MONTH_CHOICES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>
      {trends ? (
        <Chart
          trends={trends}
          metric={metric}
          // While new months load, the previous ones stay up, dimmed.
          months={trends.length as MonthChoice}
          stale={stale}
        />
      ) : (
        <Skeleton className="h-57.5 w-full sm:h-62.5" />
      )}
    </section>
  );
}

function Description({
  trends,
  metric,
}: {
  trends: MonthlyTrend[];
  metric: Metric;
}) {
  const { average, highest } = monthStats(trends, metric);
  const range = `${monthYear(trends[0].month)} – ${monthYear(trends.at(-1)!.month)}`;
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
      <span>
        {range}
        {highest && ` · ${formatMonthLong(highest.month)} highest`}
      </span>
      {average !== null && (
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="w-4.5 border-t-2 border-dashed border-foreground"
          />
          Average of full months{" "}
          <b className="text-foreground tabular-nums">
            {formatMetric(average, metric)}
          </b>
        </span>
      )}
    </p>
  );
}

function Chart({
  trends,
  metric,
  months,
  stale,
}: {
  trends: MonthlyTrend[];
  metric: Metric;
  months: MonthChoice;
  stale?: boolean;
}) {
  const { current, average, highest } = monthStats(trends, metric);
  const top = axisMax(Math.max(...trends.map((t) => metricValue(t, metric))));
  const [phoneEvery, wideEvery] = LABEL_EVERY[months];
  const columns = { gridTemplateColumns: `repeat(${months}, minmax(0, 1fr))` };

  const spoken = trends
    .map(
      (trend) =>
        `${formatMonthLong(trend.month)} ${trend.month.slice(0, 4)}${trend === current ? " to date" : ""} ${formatMetric(metricValue(trend, metric), metric)}`,
    )
    .join(", ");
  const label = `${METRIC_LABELS[metric]} by month: ${spoken}.${
    average === null
      ? ""
      : ` Average of full months ${formatMetric(average, metric)}.`
  }`;

  return (
    <div
      aria-busy={stale || undefined}
      className={cn(
        "mt-4 grid grid-cols-[44px_minmax(0,1fr)] gap-x-2.5 gap-y-2.5 transition-opacity sm:grid-cols-[56px_minmax(0,1fr)]",
        stale && "opacity-60",
      )}
    >
      <div
        aria-hidden
        className="relative h-50 text-right text-xs text-muted-foreground tabular-nums sm:h-55"
      >
        {[1, 0.5, 0].map((share) => (
          <span
            key={share}
            className="absolute right-0 -translate-y-1/2"
            style={{ top: `${(1 - share) * 100}%` }}
          >
            {formatMetric(top * share, metric)}
          </span>
        ))}
      </div>
      <div className="relative h-50 border-b border-border bg-[linear-gradient(var(--background)_1px,transparent_1px)] bg-size-[100%_50%] sm:h-55">
        <div
          role="img"
          aria-label={label}
          className={cn(
            "absolute inset-0 grid items-end px-1 forced-color-adjust-none sm:px-4",
            GAPS[months],
          )}
          style={columns}
        >
          {trends.map((trend) => {
            const value = metricValue(trend, metric);
            const isCurrent = trend === current;
            const isHighest = trend === highest;
            return (
              <div
                key={trend.month}
                className={cn(
                  "relative rounded-t-[6px] sm:rounded-t-[8px]",
                  isCurrent
                    ? "border-2 border-b-0 border-primary"
                    : isHighest
                      ? "bg-primary"
                      : "bg-bar-muted",
                )}
                style={{
                  height: `${(value / top) * 100}%`,
                  background: isCurrent ? STRIPES : undefined,
                }}
              >
                {months === 6 && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -inset-x-1 bottom-full pb-1.5 text-center text-[11px] tabular-nums sm:text-xs",
                      isHighest
                        ? "font-extrabold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <span className="rounded-sm bg-card px-0.5">
                      {formatMetric(value, metric)}
                    </span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {average !== null && (
          <div
            aria-hidden
            className="absolute inset-x-0 border-t-2 border-dashed border-foreground"
            style={{ bottom: `${(average / top) * 100}%` }}
          />
        )}
      </div>
      <span />
      <div
        aria-hidden
        className={cn(
          "grid px-1 text-center text-xs text-muted-foreground sm:px-4 sm:text-[13px]",
          GAPS[months],
        )}
        style={columns}
      >
        {trends.map((trend, index) => {
          const fromEnd = trends.length - 1 - index;
          return (
            <span
              key={trend.month}
              className={cn(
                fromEnd % phoneEvery !== 0 && "invisible",
                fromEnd % wideEvery === 0 ? "sm:visible" : "sm:invisible",
                trend === highest && "font-bold text-foreground",
              )}
            >
              {formatMonthShort(trend.month)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
