import { categoriesQuerySchema } from "@/features/spending/schemas";
import { getCategoryBreakdown } from "@/features/spending/server/repository";
import { customerRoute } from "@/lib/api/route";

export const GET = customerRoute({
  route: "/api/customers/[customerId]/spending/categories",
  query: categoriesQuerySchema,
  handler: ({ customerId, query, now }) =>
    getCategoryBreakdown(customerId, query, now),
});
