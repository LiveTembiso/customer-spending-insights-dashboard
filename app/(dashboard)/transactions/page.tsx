import type { Metadata } from "next";
import { Suspense } from "react";

import {
  TransactionsPage as TransactionsContent,
  TransactionsPageSkeleton,
} from "@/features/transactions/components/transactions-page";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage({
  searchParams,
}: PageProps<"/transactions">) {
  return (
    <Suspense fallback={<TransactionsPageSkeleton />}>
      <TransactionsContent searchParams={searchParams} />
    </Suspense>
  );
}
