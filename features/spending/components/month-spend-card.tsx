import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDayRange,
  formatDayRangeLong,
  formatPercent,
  formatRands,
} from "@/lib/format";
import { cn } from "@/lib/utils";

import { getCurrentMonthToDate } from "../server/current";

function Direction({
  change,
  className,
}: {
  change: number;
  className?: string;
}) {
  const Icon = change > 0 ? ArrowUp : change < 0 ? ArrowDown : Minus;
  return (
    <Icon aria-hidden className={cn("size-3.5", className)} strokeWidth={2.5} />
  );
}

const spoken = (change: number) =>
  change > 0 ? "up" : change < 0 ? "down" : "unchanged,";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="month-spend-title"
      className="relative overflow-hidden rounded-[22px] bg-navy p-5 text-navy-foreground sm:p-6"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-20 size-64 rounded-full bg-navy-raised"
      />
      <div className="relative grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        {children}
      </div>
    </section>
  );
}

export async function MonthSpendCard() {
  const month = await getCurrentMonthToDate();
  if (!month) return null;

  const { spentChange, transactionChange } = month.comparedToPrevious;
  const previous = month.previousRange;
  const shortRange = formatDayRange(previous.start, previous.end);
  const longRange = formatDayRangeLong(previous.start, previous.end);

  return (
    <Card>
      <div className="flex min-w-0 flex-col gap-2">
        <h2
          id="month-spend-title"
          className="text-sm font-medium text-navy-muted"
        >
          Total spend this month
        </h2>
        <p className="text-[32px] leading-none font-extrabold tracking-tight tabular-nums sm:text-[40px]">
          {formatRands(month.totalSpent)}
        </p>
        {spentChange === null ? (
          <p className="text-sm text-navy-muted">
            Nothing spent {shortRange} to compare with
          </p>
        ) : (
          <p className="flex flex-wrap items-center gap-2 text-sm text-navy-muted">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground tabular-nums">
              <Direction change={spentChange} />
              <span className="sr-only">{spoken(spentChange)}</span>
              {formatPercent(spentChange)}
            </span>
            <span aria-hidden>vs {shortRange}</span>
            <span className="sr-only">
              compared with {longRange} last month
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t border-white/15 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
        <p className="text-[28px] leading-none font-extrabold tabular-nums">
          {month.transactionCount}
        </p>
        <p className="text-sm text-navy-muted">transactions</p>
        {transactionChange !== null && (
          <p className="flex items-center gap-1 text-xs font-semibold text-navy-muted tabular-nums">
            <Direction change={transactionChange} />
            <span className="sr-only">{spoken(transactionChange)}</span>
            {formatPercent(transactionChange)}
            <span className="sr-only">
              compared with {longRange} last month
            </span>
          </p>
        )}
      </div>
    </Card>
  );
}

export function MonthSpendCardSkeleton() {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-36 bg-navy-raised" />
        <Skeleton className="h-10 w-52 bg-navy-raised" />
        <Skeleton className="h-5 w-40 bg-navy-raised" />
      </div>
      <div className="flex flex-col gap-2 sm:pl-6">
        <Skeleton className="h-7 w-12 bg-navy-raised" />
        <Skeleton className="h-4 w-24 bg-navy-raised" />
      </div>
    </Card>
  );
}
