import type { Metadata } from "next";
import { Suspense } from "react";

import {
  InsightsPage as InsightsContent,
  InsightsPageSkeleton,
} from "@/features/spending/components/insights-page";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage({ searchParams }: PageProps<"/insights">) {
  return (
    <Suspense fallback={<InsightsPageSkeleton />}>
      <InsightsContent searchParams={searchParams} />
    </Suspense>
  );
}
