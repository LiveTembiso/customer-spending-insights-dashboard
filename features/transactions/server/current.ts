import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { getFilters } from "@/features/categories/server/repository";
import { getGoals } from "@/features/goals/server/repository";
import { getCategoryBreakdown } from "@/features/spending/server/repository";
import { toDayKey } from "@/lib/dates";
import { env } from "@/lib/env";

import {
  type TransactionFilters,
  toTotalsQuery,
  toTransactionsQuery,
} from "../filters";
import { transactionsQuerySchema } from "../schemas";
import { listTransactions } from "./repository";

export const getCurrentRecentTransactions = cache(async (limit: number) => {
  await connection();
  return listTransactions(
    env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID,
    transactionsQuerySchema.parse({ limit, sortBy: "date_desc" }),
    new Date(),
  );
});

export async function getCurrentTransactionsPage(filters: TransactionFilters) {
  await connection();
  const customerId = env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID;
  const now = new Date();
  const today = toDayKey(now);
  const transactionsQuery = toTransactionsQuery(filters, today);
  const totalsQuery = toTotalsQuery(filters, today);

  const transactions = listTransactions(customerId, transactionsQuery, now);
  const options = getFilters(customerId);
  const goals = getGoals(customerId, now);
  if (!transactions || !options || !goals) return undefined;

  // The page hides spend totals while searching, so don't work them out.
  const totals = filters.q
    ? undefined
    : getCategoryBreakdown(customerId, totalsQuery, now);

  return {
    customerId,
    today,
    transactions: { query: transactionsQuery, data: transactions },
    totals: totals && { query: totalsQuery, data: totals },
    options,
    goals,
  };
}
