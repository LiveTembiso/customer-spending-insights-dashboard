import { z } from "zod";

import {
  categoryIconSchema,
  categoryNameSchema,
} from "@/features/categories/schemas";
import { DEFAULT_PERIOD } from "@/lib/periods";
import {
  amountSchema,
  dateRangeQuerySchema,
  hexColorSchema,
  isoDateSchema,
  monthSchema,
  percentChangeSchema,
  periodSchema,
  queryIntSchema,
} from "@/lib/schemas";

// GET /api/customers/{customerId}/spending/summary
export const summaryQuerySchema = z.object({
  period: periodSchema.default(DEFAULT_PERIOD),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;

export const summaryResponseSchema = z.object({
  period: periodSchema,
  totalSpent: amountSchema,
  transactionCount: z.int().nonnegative(),
  averageTransaction: amountSchema,
  // Null when nothing was spent in the period.
  topCategory: categoryNameSchema.nullable(),
  comparedToPrevious: z.object({
    spentChange: percentChangeSchema,
    transactionChange: percentChangeSchema,
  }),
});

export type SummaryResponse = z.infer<typeof summaryResponseSchema>;

// GET /api/customers/{customerId}/spending/categories
export const categoriesQuerySchema = dateRangeQuerySchema
  .safeExtend({
    period: periodSchema.default(DEFAULT_PERIOD),
  })
  .refine(
    (query) =>
      (query.startDate === undefined) === (query.endDate === undefined),
    {
      message: "startDate and endDate must be provided together",
      path: ["endDate"],
    },
  );

export type CategoriesQuery = z.infer<typeof categoriesQuerySchema>;

export const categorySpendSchema = z.object({
  name: categoryNameSchema,
  amount: amountSchema,
  percentage: z.number().min(0).max(100),
  transactionCount: z.int().nonnegative(),
  color: hexColorSchema,
  icon: categoryIconSchema,
});

export type CategorySpend = z.infer<typeof categorySpendSchema>;

export const categoriesResponseSchema = z.object({
  dateRange: z.object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  }),
  totalAmount: amountSchema,
  categories: z.array(categorySpendSchema),
});

export type CategoriesResponse = z.infer<typeof categoriesResponseSchema>;

// GET /api/customers/{customerId}/spending/trends
export const trendsQuerySchema = z.object({
  months: queryIntSchema.min(1).max(24).default(12),
});

export type TrendsQuery = z.infer<typeof trendsQuerySchema>;

export const monthlyTrendSchema = z.object({
  month: monthSchema,
  totalSpent: amountSchema,
  transactionCount: z.int().nonnegative(),
  averageTransaction: amountSchema,
});

export type MonthlyTrend = z.infer<typeof monthlyTrendSchema>;

export const trendsResponseSchema = z.object({
  trends: z.array(monthlyTrendSchema),
});

export type TrendsResponse = z.infer<typeof trendsResponseSchema>;
