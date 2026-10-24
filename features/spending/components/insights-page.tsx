import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { SectionCardSkeleton } from "@/components/layout/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { goalsQuery } from "@/features/goals/api";
import { makeQueryClient } from "@/lib/query-client";

import { categoriesQuery, summaryQuery, trendsQuery } from "../api";
import { getCurrentInsights } from "../server/insights";
import { parseView } from "../view";
import { InsightsExplorer } from "./insights-explorer";
import { InsightsSummarySkeleton } from "./insights-summary";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Renders the first view on the server; changing it happens in the browser. */
export async function InsightsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const view = parseView(await searchParams);
  const insights = await getCurrentInsights(view);
  if (!insights) notFound();

  const { customerId } = insights;
  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    summaryQuery(customerId, { period: view.period }).queryKey,
    insights.summary,
  );
  queryClient.setQueryData(
    categoriesQuery(customerId, { period: view.period }).queryKey,
    insights.categories,
  );
  queryClient.setQueryData(
    trendsQuery(customerId, { months: view.months }).queryKey,
    insights.trends,
  );
  queryClient.setQueryData(goalsQuery(customerId).queryKey, insights.goals);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InsightsExplorer customerId={customerId} />
    </HydrationBoundary>
  );
}

export function InsightsPageSkeleton() {
  return (
    <>
      <PageHeader
        eyebrow="How your spending is changing"
        title="Insights"
        actions={
          <Skeleton className="h-13 w-full rounded-[12px] bg-card sm:w-80" />
        }
      />
      <div className="flex flex-col gap-4">
        <InsightsSummarySkeleton />
        <SectionCardSkeleton lines={6} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <SectionCardSkeleton lines={5} />
          <SectionCardSkeleton lines={3} />
        </div>
      </div>
    </>
  );
}
