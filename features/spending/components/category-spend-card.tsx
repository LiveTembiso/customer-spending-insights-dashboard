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
import { CategoryDot } from "@/features/categories/components/category-dot";
import { formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

import { purchases } from "../labels";
import type { CategoriesResponse } from "../schemas";
import { CategoryDonut, DonutTotal } from "./category-donut";

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
        <EmptyState message="No spending yet." />
      ) : (
        <div
          aria-busy={stale || undefined}
          className={cn(
            "flex flex-wrap items-center gap-x-7 gap-y-4 transition-opacity",
            stale && "opacity-60",
          )}
        >
          <div className="flex items-center gap-4.5">
            <CategoryDonut
              slices={spent}
              size={176}
              className="size-32 sm:size-44"
            >
              <DonutTotal
                amount={breakdown.totalAmount}
                caption={categoriesLabel}
                className="hidden sm:flex"
              />
            </CategoryDonut>
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
                    {purchases(category.transactionCount)}
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

          <div className="hidden min-w-0 flex-[1_1_320px] sm:block">
            <Table
              aria-labelledby="category-spend-title"
              className="w-full border-collapse text-sm"
            >
              <TableHeader>
                <TableRow className="text-left text-xs text-muted-foreground">
                  <TableHead scope="col" className="pr-2 pb-2 font-semibold">
                    Category
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="px-2 pb-2 text-right font-semibold"
                  >
                    Spent
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="px-2 pb-2 text-right font-semibold"
                  >
                    Purchases
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {spent.map((category) => (
                  <TableRow
                    key={category.name}
                    className="border-t border-background"
                  >
                    <TableHead
                      scope="row"
                      className="py-2.5 pr-2 text-left font-normal"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <CategoryDot color={category.color} />
                        {category.name}
                      </span>
                    </TableHead>
                    <TableCell className="px-2 py-2.5 text-right font-bold">
                      {formatRands(category.amount)}{" "}
                      <span className="sr-only">
                        ({category.percentage.toFixed(1)}% of spending)
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-right">
                      {category.transactionCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
