import { getProfile } from "@/features/profile/server/repository";
import { customerRoute } from "@/lib/api/route";

export const GET = customerRoute({
  route: "/api/customers/[customerId]/profile",
  handler: ({ customerId, now }) => getProfile(customerId, now),
});
