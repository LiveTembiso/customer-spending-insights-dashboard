import { trendsQuerySchema } from "@/features/spending/schemas";
import { getTrends } from "@/features/spending/server/repository";
import { customerRoute } from "@/lib/api/route";

export const GET = customerRoute({
  route: "/api/customers/[customerId]/spending/trends",
  query: trendsQuerySchema,
  handler: ({ customerId, query, now }) => getTrends(customerId, query, now),
});
