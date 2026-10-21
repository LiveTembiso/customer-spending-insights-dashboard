import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryName } from "@/features/categories/schemas";
import type { CategoriesResponse } from "@/features/spending/schemas";
import { formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TransactionTotalsProps {
  category?: CategoryName;
  /** Spend for the same dates and category; missing while searching. */
  totals?: CategoriesResponse;
  totalsFailed: boolean;
  /** Transactions matching every filter, search included. */
  count?: number;
  searching: boolean;
}

function spendFor(totals: CategoriesResponse, category?: CategoryName) {
  if (!category) {
    return {
      amount: totals.totalAmount,
      count: totals.categories.reduce(
        (sum, item) => sum + item.transactionCount,
        0,
      ),
    };
  }
  const match = totals.categories.find((item) => item.name === category);
  return { amount: match?.amount ?? 0, count: match?.transactionCount ?? 0 };
}

const tile =
  "relative flex min-w-0 flex-col gap-1 sm:gap-1.5 sm:rounded-[18px] sm:px-5 sm:py-4";
const whiteTile = "sm:bg-card sm:text-foreground";
const label = "text-xs text-navy-muted sm:text-[13px]";
const whiteLabel = "sm:text-muted-foreground";
const figure =
  "text-[17px] leading-[1.1] font-extrabold tracking-tight tabular-nums sm:text-[28px]";

function Figure({ value, failed }: { value?: string; failed?: boolean }) {
  if (value !== undefined) return <span className={figure}>{value}</span>;
  if (failed) {
    return (
      <span className={figure}>
        <span aria-hidden>—</span>
        <span className="sr-only">Not available</span>
      </span>
    );
  }
  return <Skeleton className="h-6 w-20 bg-navy-raised sm:h-7 sm:bg-muted" />;
}

export function TransactionTotals({
  category,
  totals,
  totalsFailed,
  count,
  searching,
}: TransactionTotalsProps) {
  const spend = totals && !searching ? spendFor(totals, category) : undefined;

  return (
    <section
      aria-label="Totals for these filters"
      className={cn(
        "relative grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-4 overflow-hidden rounded-[18px] bg-navy px-4.5 py-4 text-navy-foreground sm:items-stretch sm:gap-3 sm:overflow-visible sm:rounded-none sm:bg-transparent sm:p-0",
        searching ? "sm:grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {!searching && (
        <div
          className={cn(
            tile,
            "max-sm:static sm:col-span-2 sm:overflow-hidden sm:bg-navy lg:col-span-1",
          )}
        >
          <span
            aria-hidden
            className="absolute -top-20 -right-16 size-42.5 rounded-full bg-navy-raised sm:-top-17.5 sm:-right-12.5 sm:size-37.5"
          />
          <span className={cn(label, "relative")}>Spent</span>
          {spend ? (
            <span className={cn(figure, "relative text-2xl sm:text-[28px]")}>
              {formatRands(spend.amount)}
            </span>
          ) : (
            <Figure failed={totalsFailed} />
          )}
        </div>
      )}
      <div className={cn(tile, whiteTile)}>
        <span className={cn(label, whiteLabel)}>Transactions</span>
        <Figure value={count === undefined ? undefined : String(count)} />
      </div>
      {!searching && (
        <div className={cn(tile, whiteTile)}>
          <span className={cn(label, whiteLabel)}>
            <span className="sm:hidden">Average</span>
            <span className="max-sm:hidden">Average per transaction</span>
          </span>
          <Figure
            failed={totalsFailed}
            value={
              spend && formatRands(spend.count ? spend.amount / spend.count : 0)
            }
          />
        </div>
      )}
    </section>
  );
}
