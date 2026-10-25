import { z } from "zod";

import {
  categoryIconSchema,
  categoryNameSchema,
} from "@/features/categories/schemas";
import {
  amountSchema,
  dateRangeQuerySchema,
  hexColorSchema,
  isoDateTimeSchema,
  queryIntSchema,
} from "@/lib/schemas";

import { MAX_PAGE_SIZE, MAX_SEARCH_LENGTH } from "./constants";

export const SORT_OPTIONS = [
  "date_desc",
  "date_asc",
  "amount_desc",
  "amount_asc",
] as const;

export const sortBySchema = z.enum(SORT_OPTIONS);

export type SortBy = z.infer<typeof sortBySchema>;

// GET /api/customers/{customerId}/transactions
export const transactionsQuerySchema = dateRangeQuerySchema.safeExtend({
  limit: queryIntSchema.min(1).max(MAX_PAGE_SIZE).default(20),
  offset: queryIntSchema.min(0).default(0),
  category: categoryNameSchema.optional(),
  sortBy: sortBySchema.default("date_desc"),
  // A cleared search box sends `q=`; treat it as no search.
  q: z
    .string()
    .trim()
    .max(MAX_SEARCH_LENGTH)
    .optional()
    .transform((value) => value || undefined),
});

export type TransactionsQuery = z.infer<typeof transactionsQuerySchema>;

export const transactionSchema = z.object({
  id: z.string().regex(/^txn_\w+$/),
  date: isoDateTimeSchema,
  merchant: z.string().min(1),
  category: categoryNameSchema,
  amount: amountSchema,
  description: z.string(),
  paymentMethod: z.string().min(1),
  icon: categoryIconSchema,
  categoryColor: hexColorSchema,
});

export type Transaction = z.infer<typeof transactionSchema>;

export const paginationSchema = z.object({
  total: z.int().nonnegative(),
  limit: z.int().min(1).max(MAX_PAGE_SIZE),
  offset: z.int().nonnegative(),
  hasMore: z.boolean(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const transactionsResponseSchema = z.object({
  transactions: z.array(transactionSchema),
  pagination: paginationSchema,
});

export type TransactionsResponse = z.infer<typeof transactionsResponseSchema>;
