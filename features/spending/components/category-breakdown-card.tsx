import { SectionCard } from "@/components/layout/section-card";
import { CategoryDot } from "@/features/categories/components/category-dot";
import { formatDayRange, formatRands } from "@/lib/format";

import { donutGradient } from "../charts";
import { getCurrentMonthCategories } from "../server/current";

export async function CategoryBreakdownCard() {
  const breakdown = await getCurrentMonthCategories();
  if (!breakdown) return null;

  const { startDate, endDate } = breakdown.dateRange;
  const spent = breakdown.categories.filter((category) => category.amount > 0);

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
        <div className="flex flex-wrap items-center gap-5">
          {/* The list carries every figure, so the ring is decorative. */}
          <div
            aria-hidden
            className="flex size-[150px] shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgba(14,27,44,0.18)] forced-color-adjust-none"
            style={{ background: donutGradient(spent) }}
          >
            <div className="flex size-[100px] flex-col items-center justify-center gap-0.5 rounded-full bg-card shadow-[0_0_0_1px_rgba(14,27,44,0.18)]">
              <span className="text-base font-extrabold tabular-nums">
                {formatRands(breakdown.totalAmount, { cents: false })}
              </span>
              <span className="text-xs text-muted-foreground">
                {spent.length} {spent.length === 1 ? "category" : "categories"}
              </span>
            </div>
          </div>
          <ul className="flex min-w-40 flex-1 flex-col gap-2.5 text-sm tabular-nums">
            {spent.map((category) => (
              <li key={category.name} className="flex items-center gap-2">
                <CategoryDot color={category.color} />
                <span className="flex-1">{category.name}</span>
                <span className="text-muted-foreground">
                  {category.percentage.toFixed(1)}%
                </span>
                <span className="min-w-20 text-right font-bold">
                  {formatRands(category.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
