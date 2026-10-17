import { summaryQuerySchema } from "@/features/spending/schemas";
import { getSummary } from "@/features/spending/server/repository";
import { customerRoute } from "@/lib/api/route";

export const GET = customerRoute({
  route: "/api/customers/[customerId]/spending/summary",
  query: summaryQuerySchema,
  handler: ({ customerId, query, now }) => getSummary(customerId, query, now),
});
