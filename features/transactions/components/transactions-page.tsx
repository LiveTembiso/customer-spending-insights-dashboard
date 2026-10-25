import { Card } from "@/components/ui/card";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { filtersQuery } from "@/features/categories/api";
import { goalsQuery } from "@/features/goals/api";
import { categoriesQuery } from "@/features/spending/api";
import { makeQueryClient } from "@/lib/query-client";

import { transactionsQuery } from "../api";
import { parseFilters } from "../filters";
import { getCurrentTransactionsPage } from "../server/current";
import { ListSkeleton } from "./transaction-list";
import { TransactionsExplorer } from "./transactions-explorer";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Renders the first view on the server; filtering then happens in the browser. */
export async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = await getCurrentTransactionsPage(
    parseFilters(await searchParams),
  );
  if (!page) notFound();

  const { customerId } = page;
  const queryClient = makeQueryClient();
  queryClient.setQueryData(
    transactionsQuery(customerId, page.transactions.query).queryKey,
    page.transactions.data,
  );
  if (page.totals) {
    queryClient.setQueryData(
      categoriesQuery(customerId, page.totals.query).queryKey,
      page.totals.data,
    );
  }
  queryClient.setQueryData(filtersQuery(customerId).queryKey, page.options);
  queryClient.setQueryData(goalsQuery(customerId).queryKey, page.goals);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionsExplorer customerId={customerId} today={page.today} />
    </HydrationBoundary>
  );
}

export function TransactionsPageSkeleton() {
  return (
    <>
      <PageHeader eyebrow="Search, filter and sort" title="Transactions" />
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4 rounded-[22px] bg-card p-5">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-2/3" />
        </Card>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-3">
          <Skeleton className="h-[86px] rounded-[18px] bg-card" />
          <Skeleton className="h-[86px] rounded-[18px] bg-card" />
          <Skeleton className="h-[86px] rounded-[18px] bg-card" />
        </div>
        <Card className="flex flex-col gap-4 rounded-[22px] bg-card p-5">
          <Skeleton className="h-6 w-40" />
          <ListSkeleton />
        </Card>
      </div>
    </>
  );
}
