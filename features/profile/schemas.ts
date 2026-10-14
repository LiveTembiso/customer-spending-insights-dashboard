import { z } from "zod";

import { amountSchema, currencySchema, isoDateSchema } from "@/lib/schemas";

// GET /api/customers/{customerId}/profile
export const profileResponseSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  joinDate: isoDateSchema,
  accountType: z.string().min(1),
  totalSpent: amountSchema,
  currency: currencySchema,
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
