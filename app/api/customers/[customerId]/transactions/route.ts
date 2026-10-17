import { transactionsQuerySchema } from "@/features/transactions/schemas";
import { listTransactions } from "@/features/transactions/server/repository";
import { customerRoute } from "@/lib/api/route";

export const GET = customerRoute({
  route: "/api/customers/[customerId]/transactions",
  query: transactionsQuerySchema,
  handler: ({ customerId, query, now }) =>
    listTransactions(customerId, query, now),
});
