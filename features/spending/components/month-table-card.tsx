import { SectionCard } from "@/components/layout/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

import { monthStats, vsAverage } from "../insights";
import { monthYear, transactions } from "../labels";
import type { MonthlyTrend } from "../schemas";

function VsAverage({
  change,
  isCurrent,
}: {
  change: number | null;
  isCurrent: boolean;
}) {
  if (change === null) {
    return (
      <>
        <span aria-hidden>—</span>
        <span className="sr-only">
          {isCurrent ? "Month not finished" : "No average to compare with"}
        </span>
      </>
    );
  }
  const sign = change > 0 ? "+" : change < 0 ? "−" : "";
  return (
    <span
      className={cn(
        change > 0
          ? "font-bold text-warning-foreground"
          : change < 0
            ? "text-primary"
            : "text-muted-foreground",
      )}
    >
      <span aria-hidden>
        {sign}
        {Math.abs(change).toFixed(1)}%
      </span>
      <span className="sr-only">
        {change === 0
          ? "Same as average"
          : `${Math.abs(change).toFixed(1)}% ${change > 0 ? "above" : "below"} average`}
      </span>
    </span>
  );
}

export function MonthTableCard({
  trends,
  stale,
}: {
  trends?: MonthlyTrend[];
  stale?: boolean;
}) {
  if (!trends) {
    return (
      <SectionCard id="month-table-title" title="Month by month">
        <Skeleton className="h-60 w-full" />
      </SectionCard>
    );
  }

  const { current, average } = monthStats(trends, "total");
  const rows = trends.toReversed().map((trend) => ({
    trend,
    isCurrent: trend === current,
    change: trend === current ? null : vsAverage(trend.totalSpent, average),
  }));

  return (
    <SectionCard
      id="month-table-title"
      title="Month by month"
      description="Newest first · compared with the average of full months"
    >
      <div
        aria-busy={stale || undefined}
        className={cn("transition-opacity", stale && "opacity-60")}
      >
        <ul className="flex flex-col tabular-nums lg:hidden">
          {rows.map(({ trend, isCurrent, change }) => (
            <li
              key={trend.month}
              className="flex items-center gap-3 border-t border-background py-2.5"
            >
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-bold">
                  {monthYear(trend.month)}
                  {isCurrent && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · to date
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {transactions(trend.transactionCount)} · avg{" "}
                  {formatRands(trend.averageTransaction)}
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className="font-extrabold">
                  {formatRands(trend.totalSpent)}
                </span>
                {change !== null && (
                  <span className="text-xs">
                    <VsAverage change={change} isCurrent={isCurrent} />
                    <span aria-hidden className="text-muted-foreground">
                      {" "}
                      vs avg
                    </span>
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <div
          role="region"
          aria-labelledby="month-table-title"
          tabIndex={0}
          className="hidden overflow-x-auto lg:block"
        >
          <table
            aria-labelledby="month-table-title"
            className="w-full min-w-[620px] border-collapse text-sm"
          >
            <thead>
              <tr className="bg-muted text-left text-[13px] text-muted-foreground">
                <th
                  scope="col"
                  className="rounded-l-[10px] px-3 py-2.75 font-semibold"
                >
                  Month
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.75 text-right font-semibold"
                >
                  Total spent
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.75 text-right font-semibold"
                >
                  vs average
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.75 text-right font-semibold"
                >
                  Transactions
                </th>
                <th
                  scope="col"
                  className="rounded-r-[10px] px-3 py-2.75 text-right font-semibold"
                >
                  Average transaction
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map(({ trend, isCurrent, change }) => (
                <tr
                  key={trend.month}
                  className="border-b border-background last:border-0"
                >
                  <th scope="row" className="p-3 text-left font-bold">
                    {monthYear(trend.month)}
                    {isCurrent && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · to date
                      </span>
                    )}
                  </th>
                  <td className="p-3 text-right font-bold">
                    {formatRands(trend.totalSpent)}
                  </td>
                  <td className="p-3 text-right">
                    <VsAverage change={change} isCurrent={isCurrent} />
                  </td>
                  <td className="p-3 text-right">{trend.transactionCount}</td>
                  <td className="p-3 text-right">
                    {formatRands(trend.averageTransaction)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}
