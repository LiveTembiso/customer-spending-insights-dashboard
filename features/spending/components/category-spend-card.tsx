import { SectionCard } from "@/components/layout/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryDot } from "@/features/categories/components/category-dot";
import { formatRands } from "@/lib/format";
import { roundTo } from "@/lib/money";
import { cn } from "@/lib/utils";

import { donutGradient } from "../charts";
import type { CategoriesResponse } from "../schemas";

const purchases = (count: number) =>
  count === 1 ? "1 purchase" : `${count} purchases`;

const averageOf = (amount: number, count: number) =>
  count === 0 ? 0 : roundTo(amount / count, 2);

interface CategorySpendCardProps {
  description: string;
  breakdown?: CategoriesResponse;
  stale?: boolean;
  className?: string;
}

export function CategorySpendCard({
  description,
  breakdown,
  stale,
  className,
}: CategorySpendCardProps) {
  const spent = breakdown?.categories
    .filter((category) => category.amount > 0)
    .toSorted((a, b) => b.amount - a.amount);
  const count = spent?.length ?? 0;
  const categoriesLabel = count === 1 ? "1 category" : `${count} categories`;

  return (
    <SectionCard
      id="category-spend-title"
      title="Category breakdown"
      description={description}
      className={className}
    >
      {!breakdown || !spent ? (
        <Skeleton className="h-44 w-full" />
      ) : spent.length === 0 ? (
        <p className="text-sm text-muted-foreground">No spending yet.</p>
      ) : (
        <div
          aria-busy={stale || undefined}
          className={cn(
            "flex flex-wrap items-center gap-x-7 gap-y-4 transition-opacity",
            stale && "opacity-60",
          )}
        >
          <div className="flex items-center gap-4.5">
            {/* The table carries every figure, so the ring is decorative. */}
            <div
              aria-hidden
              className="flex size-32 shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgba(14,27,44,0.18)] forced-color-adjust-none sm:size-44"
              style={{ background: donutGradient(spent) }}
            >
              <div className="flex size-[84px] flex-col items-center justify-center gap-0.5 rounded-full bg-card shadow-[0_0_0_1px_rgba(14,27,44,0.18)] sm:size-29">
                <span className="hidden text-[17px] font-extrabold tabular-nums sm:inline">
                  {formatRands(breakdown.totalAmount)}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {categoriesLabel}
                </span>
              </div>
            </div>
            <p className="flex flex-col gap-0.5 sm:hidden">
              <span className="text-xs text-muted-foreground">
                Spent across {categoriesLabel}
              </span>
              <span className="text-[22px] font-extrabold tracking-tight tabular-nums">
                {formatRands(breakdown.totalAmount)}
              </span>
            </p>
          </div>

          <ul className="flex w-full flex-col tabular-nums sm:hidden">
            {spent.map((category) => (
              <li
                key={category.name}
                className="flex items-center gap-3 border-t border-background py-2.5"
              >
                <CategoryDot color={category.color} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-bold">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {purchases(category.transactionCount)} · avg{" "}
                    {formatRands(
                      averageOf(category.amount, category.transactionCount),
                    )}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-0.5">
                  <span className="font-extrabold">
                    {formatRands(category.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {category.percentage.toFixed(1)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="hidden min-w-0 flex-[1_1_320px] overflow-x-auto sm:block">
            <table
              aria-labelledby="category-spend-title"
              className="w-full border-collapse text-sm"
            >
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="pr-2 pb-2 font-semibold">
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-2 pb-2 text-right font-semibold"
                  >
                    Spent
                  </th>
                  <th
                    scope="col"
                    className="px-2 pb-2 text-right font-semibold"
                  >
                    Purchases
                  </th>
                  <th
                    scope="col"
                    className="pb-2 pl-2 text-right font-semibold"
                  >
                    Average
                  </th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {spent.map((category) => (
                  <tr
                    key={category.name}
                    className="border-t border-background"
                  >
                    <th
                      scope="row"
                      className="py-2.5 pr-2 text-left font-normal"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <CategoryDot color={category.color} />
                        {category.name}
                      </span>
                    </th>
                    <td className="px-2 py-2.5 text-right font-bold">
                      {formatRands(category.amount)}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      {category.transactionCount}
                    </td>
                    <td className="py-2.5 pl-2 text-right text-muted-strong">
                      {formatRands(
                        averageOf(category.amount, category.transactionCount),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
