import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { dayOfMonth, daysInMonth, toDayKey, toMonthKey } from "@/lib/dates";
import { env } from "@/lib/env";

import { getCategoryBreakdown, getMonthToDate, getTrends } from "./repository";

const customerId = () => env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID;

export const getCurrentMonthToDate = cache(async () => {
  await connection();
  return getMonthToDate(customerId(), new Date());
});

export const getCurrentMonthCategories = cache(async () => {
  await connection();
  const now = new Date();
  const today = toDayKey(now);
  return getCategoryBreakdown(
    customerId(),
    { period: "30d", startDate: `${toMonthKey(now)}-01`, endDate: today },
    now,
  );
});

export const getCurrentTrends = cache(async (months: number) => {
  await connection();
  const now = new Date();
  const response = getTrends(customerId(), { months }, now);
  if (!response) return undefined;
  const today = toDayKey(now);
  return {
    ...response,
    monthProgress: {
      day: dayOfMonth(today),
      days: daysInMonth(toMonthKey(now)),
    },
  };
});
