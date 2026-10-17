import { customerQuery } from "@/lib/api/queries";

import { goalsResponseSchema } from "./schemas";

export const goalsQuery = (customerId: string) =>
  customerQuery(customerId, "goals", goalsResponseSchema);
