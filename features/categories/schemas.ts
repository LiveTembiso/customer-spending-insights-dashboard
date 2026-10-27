import { z } from "zod";

import { hexColorSchema, periodSchema } from "@/lib/schemas";

export const CATEGORY_NAMES = [
  "Groceries",
  "Entertainment",
  "Transportation",
  "Dining",
  "Shopping",
  "Utilities",
] as const;

export const categoryNameSchema = z.enum(CATEGORY_NAMES);

export type CategoryName = z.infer<typeof categoryNameSchema>;

// Lucide icon names, as sent by the API.
export const categoryIconSchema = z.enum([
  "shopping-cart",
  "film",
  "car",
  "utensils",
  "shopping-bag",
  "zap",
]);

export type CategoryIcon = z.infer<typeof categoryIconSchema>;

export const categorySchema = z.object({
  name: categoryNameSchema,
  color: hexColorSchema,
  icon: categoryIconSchema,
});

export type Category = z.infer<typeof categorySchema>;

export const dateRangePresetSchema = z.object({
  label: z.string().min(1),
  value: periodSchema,
});

// GET /api/customers/{customerId}/filters
export const filtersResponseSchema = z.object({
  categories: z.array(categorySchema),
  dateRangePresets: z.array(dateRangePresetSchema),
});

export type FiltersResponse = z.infer<typeof filtersResponseSchema>;
