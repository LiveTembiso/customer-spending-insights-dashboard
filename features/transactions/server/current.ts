import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { env } from "@/lib/env";

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
