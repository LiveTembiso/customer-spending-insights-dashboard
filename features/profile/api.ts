import { customerQuery } from "@/lib/api/queries";

import { profileResponseSchema } from "./schemas";

export const profileQuery = (customerId: string) =>
  customerQuery(customerId, "profile", profileResponseSchema);
