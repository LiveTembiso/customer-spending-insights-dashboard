import { SectionCard } from "@/components/layout/section-card";
import { formatMonthLong, formatMonthShort, formatRands } from "@/lib/format";

import { axisMax } from "../charts";
import { getCurrentTrends } from "../server/current";

const MONTHS = 6;

const STRIPES =
  "repeating-linear-gradient(135deg, var(--primary) 0 3px, var(--card) 3px 7px)";

export async function MonthlyTrendCard() {
  const response = await getCurrentTrends(MONTHS);
  if (!response) return null;

  const { trends, monthProgress } = response;
  const top = axisMax(Math.max(...trends.map((trend) => trend.totalSpent)));
  const progress = `${monthProgress.day} of ${monthProgress.days} days`;
  const first = trends[0];
  const last = trends.at(-1)!;
  const summary = trends
    .map((trend, index) =>
      index === trends.length - 1
        ? `${formatMonthLong(trend.month)} to date ${formatRands(trend.totalSpent)} (${progress})`
        : `${formatMonthLong(trend.month)} ${formatRands(trend.totalSpent)}`,
    )
    .join(", ");

  return (
    <SectionCard
      id="trend-title"
      title="Monthly spending"
      link={{
        href: "/insights",
        label: "View insights",
        context: "on monthly spending",
      }}
    >
      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-2">
        <div
          aria-hidden
          className="flex h-[180px] flex-col justify-between text-right text-xs text-muted-foreground tabular-nums"
        >
          <span>{formatRands(top, { cents: false })}</span>
          <span>{formatRands(top / 2, { cents: false })}</span>
          <span>R0</span>
        </div>
        <div
          role="img"
          aria-label={`Monthly spending, ${formatMonthLong(first.month)} to ${formatMonthLong(last.month)}: ${summary}`}
          className="grid h-[180px] grid-cols-6 items-end gap-2.5 border-b border-border bg-[linear-gradient(var(--background)_1px,transparent_1px)] bg-[length:100%_90px] forced-color-adjust-none sm:gap-3"
        >
          {trends.map((trend, index) => {
            const current = index === trends.length - 1;
            return (
              <div
                key={trend.month}
                className={
                  current
                    ? "rounded-t-md border-2 border-b-0 border-primary"
                    : "rounded-t-md bg-primary"
                }
                style={{
                  height: `${(trend.totalSpent / top) * 100}%`,
                  background: current ? STRIPES : undefined,
                }}
              />
            );
          })}
        </div>
        <span />
        <div
          aria-hidden
          className="grid grid-cols-6 gap-2.5 text-center text-xs text-muted-foreground sm:gap-3"
        >
          {trends.map((trend, index) => (
            <span
              key={trend.month}
              className={
                index === trends.length - 1
                  ? "font-bold text-foreground"
                  : undefined
              }
            >
              {formatMonthShort(trend.month)}
            </span>
          ))}
        </div>
      </div>
      <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <span
          aria-hidden
          className="size-3.5 shrink-0 rounded-[3px] border-2 border-primary forced-color-adjust-none"
          style={{
            background:
              "repeating-linear-gradient(135deg, var(--primary) 0 2px, var(--card) 2px 5px)",
          }}
        />
        Striped bar: month to date ({progress})
      </p>
    </SectionCard>
  );
}
