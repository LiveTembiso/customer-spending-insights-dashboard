import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
  if (!trends || trends.length === 0) {
    return (
      <SectionCard id="month-table-title" title="Month by month">
        {trends ? (
          <EmptyState message="No spending yet." />
        ) : (
          <Skeleton className="h-60 w-full" />
        )}
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

        <div className="hidden lg:block">
          <Table
            containerProps={{
              role: "region",
              "aria-label": "Month by month table, scrollable",
              tabIndex: 0,
            }}
            aria-labelledby="month-table-title"
            className="w-full min-w-[620px] border-collapse text-sm"
          >
            <TableHeader>
              <TableRow className="bg-muted text-left text-[13px] text-muted-foreground">
                <TableHead
                  scope="col"
                  className="rounded-l-[10px] px-3 py-2.75 font-semibold"
                >
                  Month
                </TableHead>
                <TableHead
                  scope="col"
                  className="px-3 py-2.75 text-right font-semibold"
                >
                  Total spent
                </TableHead>
                <TableHead
                  scope="col"
                  className="px-3 py-2.75 text-right font-semibold"
                >
                  vs average
                </TableHead>
                <TableHead
                  scope="col"
                  className="px-3 py-2.75 text-right font-semibold"
                >
                  Transactions
                </TableHead>
                <TableHead
                  scope="col"
                  className="rounded-r-[10px] px-3 py-2.75 text-right font-semibold"
                >
                  Average transaction
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="tabular-nums">
              {rows.map(({ trend, isCurrent, change }) => (
                <TableRow
                  key={trend.month}
                  className="border-b border-background last:border-0"
                >
                  <TableHead scope="row" className="p-3 text-left font-bold">
                    {monthYear(trend.month)}
                    {isCurrent && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · to date
                      </span>
                    )}
                  </TableHead>
                  <TableCell className="p-3 text-right font-bold">
                    {formatRands(trend.totalSpent)}
                  </TableCell>
                  <TableCell className="p-3 text-right">
                    <VsAverage change={change} isCurrent={isCurrent} />
                  </TableCell>
                  <TableCell className="p-3 text-right">
                    {trend.transactionCount}
                  </TableCell>
                  <TableCell className="p-3 text-right">
                    {formatRands(trend.averageTransaction)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </SectionCard>
  );
}
