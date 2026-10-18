import { Suspense } from "react";

import { SectionCardSkeleton } from "@/components/layout/section-card";
import { CategoryBreakdownCard } from "@/features/spending/components/category-breakdown-card";
import {
  MonthSpendCard,
  MonthSpendCardSkeleton,
} from "@/features/spending/components/month-spend-card";
import { MonthlyTrendCard } from "@/features/spending/components/monthly-trend-card";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="overview-title"
        className="grid gap-6 py-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center lg:gap-10"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
            Spending insights
          </p>
          <h1
            id="overview-title"
            className="text-[32px] leading-[1.1] font-extrabold tracking-tight text-heading md:text-[40px]"
          >
            Understand your
            <br />
            spending
          </h1>
          <p className="max-w-[44ch] text-base text-muted-foreground">
            See where your money goes, spot trends and make smarter financial
            decisions.
          </p>
        </div>
        <Suspense fallback={<MonthSpendCardSkeleton />}>
          <MonthSpendCard />
        </Suspense>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        <Suspense fallback={<SectionCardSkeleton lines={6} />}>
          <CategoryBreakdownCard />
        </Suspense>
        <Suspense fallback={<SectionCardSkeleton lines={6} />}>
          <MonthlyTrendCard />
        </Suspense>
      </div>
    </div>
  );
}
