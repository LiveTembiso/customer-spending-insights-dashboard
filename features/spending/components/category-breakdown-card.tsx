import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/layout/section-card";
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
        <EmptyState message="No spending yet." />
      ) : (
        <div className="flex justify-center py-2">
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
        </div>
      )}
    </SectionCard>
  );
}
