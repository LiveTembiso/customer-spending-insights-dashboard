import "server-only";

import { connection } from "next/server";

import { getGoals } from "@/features/goals/server/repository";
import { env } from "@/lib/env";

import type { InsightsView } from "../view";
import { getCategoryBreakdown, getSummary, getTrends } from "./repository";

export async function getCurrentInsights({ period, months }: InsightsView) {
  await connection();
  const customerId = env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID;
  const now = new Date();

  const summary = getSummary(customerId, { period }, now);
  const categories = getCategoryBreakdown(customerId, { period }, now);
  const trends = getTrends(customerId, { months }, now);
  const goals = getGoals(customerId, now);
  if (!summary || !categories || !trends || !goals) return undefined;

  return { customerId, summary, categories, trends, goals };
}
