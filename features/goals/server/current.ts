import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { getCurrentMonthCategories } from "@/features/spending/server/current";
import { toDayKey } from "@/lib/dates";
import { env } from "@/lib/env";

import { byUrgency, monthElapsedPercent } from "../pace";
import { getGoals } from "./repository";

/** The signed-in customer's goals, read once per request. */
export const getCurrentGoals = cache(async () => {
  await connection();
  return getGoals(env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID, new Date());
});

/** Goals most urgent first, with how far through the month we are. */
export const getCurrentGoalsProgress = cache(async () => {
  await connection();
  // One clock reading, so status and the pace marker agree at month end.
  const now = new Date();
  const response = getGoals(env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID, now);
  if (!response) return undefined;
  return {
    goals: response.goals.toSorted(byUrgency),
    monthElapsed: monthElapsedPercent(now),
    today: toDayKey(now),
  };
});

/** This month's spending in categories that have no goal. */
export const getCurrentUntrackedSpending = cache(async () => {
  const [goals, categories] = await Promise.all([
    getCurrentGoalsProgress(),
    getCurrentMonthCategories(),
  ]);
  if (!goals || !categories) return undefined;
  const tracked = new Set(goals.goals.map((goal) => goal.category));
  return {
    dateRange: categories.dateRange,
    categories: categories.categories.filter(
      (category) => !tracked.has(category.name) && category.amount > 0,
    ),
  };
});
