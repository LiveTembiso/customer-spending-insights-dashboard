import { getFilters } from "@/features/categories/server/repository";
import { customerRoute } from "@/lib/api/route";

export const GET = customerRoute({
  route: "/api/customers/[customerId]/filters",
  handler: ({ customerId }) => getFilters(customerId),
});
