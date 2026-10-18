import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { env } from "@/lib/env";

import { getGoals } from "./repository";

/** The signed-in customer's goals, read once per request. */
export const getCurrentGoals = cache(async () => {
  await connection();
  return getGoals(env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID, new Date());
});
