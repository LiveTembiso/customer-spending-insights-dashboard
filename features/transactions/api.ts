import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { customerQuery } from "@/lib/api/queries";

import { type TransactionsQuery, transactionsResponseSchema } from "./schemas";

export const transactionsQuery = (
  customerId: string,
  query: TransactionsQuery,
) =>
  queryOptions({
    ...customerQuery(
      customerId,
      "transactions",
      transactionsResponseSchema,
      query,
    ),
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
  });
