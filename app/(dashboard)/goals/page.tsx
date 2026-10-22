import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCardSkeleton } from "@/components/layout/section-card";
import {
  GoalsMonth,
  GoalsOverview,
  GoalsOverviewSkeleton,
} from "@/features/goals/components/goals-overview";
import { UntrackedSpending } from "@/features/goals/components/untracked-spending";

export const metadata: Metadata = { title: "Goals" };

export default function GoalsPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Suspense fallback="This month's budgets">
            <GoalsMonth />
          </Suspense>
        }
        title="Spending goals"
      />
      <Suspense fallback={<GoalsOverviewSkeleton />}>
        <GoalsOverview />
      </Suspense>
      <Suspense fallback={<SectionCardSkeleton lines={3} />}>
        <UntrackedSpending />
      </Suspense>
    </>
  );
}
