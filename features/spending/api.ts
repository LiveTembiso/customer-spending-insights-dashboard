import { customerQuery } from "@/lib/api/queries";

import {
  type CategoriesQuery,
  categoriesResponseSchema,
  type SummaryQuery,
  summaryResponseSchema,
  type TrendsQuery,
  trendsResponseSchema,
} from "./schemas";

export const summaryQuery = (customerId: string, query: SummaryQuery) =>
  customerQuery(customerId, "spending/summary", summaryResponseSchema, query);

export const categoriesQuery = (customerId: string, query: CategoriesQuery) =>
  customerQuery(
    customerId,
    "spending/categories",
    categoriesResponseSchema,
    query,
  );

export const trendsQuery = (customerId: string, query: TrendsQuery) =>
  customerQuery(customerId, "spending/trends", trendsResponseSchema, query);
