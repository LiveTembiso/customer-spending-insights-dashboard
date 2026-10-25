import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { CategoryDot } from "@/features/categories/components/category-dot";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { formatPercent, formatRands } from "@/lib/format";
import { PERIOD_LABELS } from "@/lib/periods";
import type { Period } from "@/lib/schemas";
import { cn } from "@/lib/utils";

import type { CategoriesResponse, SummaryResponse } from "../schemas";

const tile =
  "flex min-w-0 flex-col gap-1 rounded-[18px] bg-card px-4 py-3.5 sm:gap-1.5 sm:px-5 sm:py-4.5";
const label = "text-xs text-muted-foreground sm:text-[13px]";
const figure =
  "text-[22px] leading-[1.15] font-extrabold tracking-tight tabular-nums sm:text-[28px] sm:leading-[1.1]";
const note = "text-xs sm:text-[13px]";

function Change({
  change,
  words,
  previous,
  colors,
}: {
  change: number | null;
  words: [more: string, fewer: string];
  previous: string;
  colors: [rising: string, falling: string];
}) {
  if (change === null) {
    return (
      <span className={cn(note, "text-muted-foreground")}>
        Nothing to compare with
      </span>
    );
  }
  if (change === 0) {
    return (
      <span className={cn(note, "text-muted-foreground")}>
        Same as the {previous}
      </span>
    );
  }
  const Icon = change > 0 ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        note,
        "inline-flex items-center gap-1 font-bold",
        change > 0 ? colors[0] : colors[1],
      )}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" strokeWidth={2.5} />
      {formatPercent(change)} {change > 0 ? words[0] : words[1]}{" "}
      <span className="sr-only">than the {previous}</span>
    </span>
  );
}

interface InsightsSummaryProps {
  period: Period;
  summary?: SummaryResponse;
  categories?: CategoriesResponse;
  stale?: boolean;
}

export function InsightsSummary({
  period,
  summary,
  categories,
  stale,
}: InsightsSummaryProps) {
  if (!summary) return <InsightsSummarySkeleton />;

  const { spentChange, transactionChange } = summary.comparedToPrevious;
  const top = categories?.categories.find(
    (category) => category.name === summary.topCategory,
  );

  return (
    <section
      aria-label={`Compared with the ${PERIOD_LABELS[period].previous}`}
      aria-busy={stale || undefined}
      className={cn(
        "grid grid-cols-2 gap-3 transition-opacity lg:grid-cols-3",
        stale && "opacity-60",
      )}
    >
      <Card className={tile}>
        <span className={label}>Total spent</span>
        <span className={figure}>{formatRands(summary.totalSpent)}</span>
        <Change
          change={spentChange}
          words={["more", "less"]}
          previous={PERIOD_LABELS[period].previous}
          colors={["text-warning-foreground", "text-primary"]}
        />
      </Card>
      <Card className={tile}>
        <span className={label}>Transactions</span>
        <span className={figure}>{summary.transactionCount}</span>
        <Change
          change={transactionChange}
          words={["more", "fewer"]}
          previous={PERIOD_LABELS[period].previous}
          colors={["text-muted-strong", "text-muted-strong"]}
        />
      </Card>
      <Card
        className={cn(
          tile,
          "col-span-2 flex-row items-center gap-3 sm:gap-3 lg:col-span-1 lg:flex-col lg:items-start lg:gap-1.5",
        )}
      >
        {top && (
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-navy shadow-[inset_0_0_0_1px_rgba(14,27,44,0.25)] forced-color-adjust-none lg:hidden"
            style={{ backgroundColor: top.color }}
          >
            <CategoryIcon name={top.icon} className="size-[50%]" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-none lg:gap-1.5">
          <span className={label}>Top category</span>
          <span className="flex items-center gap-2 text-[17px] leading-[1.15] font-extrabold tracking-tight lg:text-[28px] lg:leading-[1.1]">
            {top && (
              <CategoryDot
                color={top.color}
                className="hidden size-3 lg:inline-block"
              />
            )}
            {summary.topCategory ?? "No spending yet"}
          </span>
        </span>
        {top && (
          <span className={cn(note, "text-muted-foreground tabular-nums")}>
            <b className="font-bold text-foreground lg:font-normal lg:text-muted-foreground">
              {top.percentage.toFixed(1)}%
            </b>{" "}
            of spend
          </span>
        )}
      </Card>
    </section>
  );
}

export function InsightsSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <Card
          key={index}
          className={cn(tile, index === 2 && "col-span-2 lg:col-span-1")}
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-24" />
        </Card>
      ))}
    </div>
  );
}
