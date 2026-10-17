import { getGoals } from "@/features/goals/server/repository";
import { customerRoute } from "@/lib/api/route";

export const GET = customerRoute({
  route: "/api/customers/[customerId]/goals",
  handler: ({ customerId, now }) => getGoals(customerId, now),
});
