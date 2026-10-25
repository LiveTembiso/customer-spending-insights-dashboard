import Link from "next/link";

import { SectionCard } from "@/components/layout/section-card";
import { CategoryDot } from "@/features/categories/components/category-dot";
import { purchasesHref } from "@/features/transactions/links";
import { formatDayRange, formatRands } from "@/lib/format";

import { getCurrentMonthCategories } from "../server/current";
import { CategoryDonut, DonutTotal } from "./category-donut";

export async function CategoryBreakdownCard() {
  const breakdown = await getCurrentMonthCategories();
  if (!breakdown) return null;

  const { startDate, endDate } = breakdown.dateRange;
  const spent = breakdown.categories.filter((category) => category.amount > 0);
  const label = `Spending by category this month: ${spent
    .map(
      (category) =>
        `${category.name} ${formatRands(category.amount)} (${category.percentage.toFixed(1)}%)`,
    )
    .join(", ")}. Total ${formatRands(breakdown.totalAmount)}.`;

  return (
    <SectionCard
      id="categories-title"
      title="Where it went"
      description={`This month, ${formatDayRange(startDate, endDate)}`}
      link={{
        href: "/insights",
        label: "View details",
        context: "of spending by category",
      }}
    >
      {spent.length === 0 ? (
        <p className="text-sm text-muted-foreground">No spending yet.</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <CategoryDonut
            slices={spent}
            size={180}
            label={label}
            className="size-[180px]"
          >
            <DonutTotal
              amount={breakdown.totalAmount}
              caption={`${spent.length} ${spent.length === 1 ? "category" : "categories"}`}
            />
          </CategoryDonut>
          <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-1">
            {spent.map((category) => (
              <li key={category.name} className="min-w-0">
                <Link
                  href={purchasesHref(category.name, {
                    start: startDate,
                    end: endDate,
                  })}
                  className="flex min-h-11 items-start gap-2 rounded-lg py-2 text-[13px] hover:bg-muted focus-visible:bg-muted"
                >
                  <CategoryDot color={category.color} className="mt-1" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-semibold break-words text-primary">
                      {category.name}
                    </span>{" "}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatRands(category.amount)}
                      <span className="sr-only">
                        {" "}
                        · {category.percentage.toFixed(1)}% of spending. View
                        transactions.
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
