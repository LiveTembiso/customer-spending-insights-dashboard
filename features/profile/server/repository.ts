import "server-only";

import { totalCents } from "@/features/transactions/server/records";
import { getCustomerTransactions } from "@/features/transactions/server/store";
import { toRands } from "@/lib/money";

import type { ProfileResponse } from "../schemas";
import { findCustomer } from "./customers";

export function getProfile(
  customerId: string,
  now: Date,
): ProfileResponse | undefined {
  const customer = findCustomer(customerId);
  const records = getCustomerTransactions(customerId, now);
  if (!customer || !records) return undefined;

  return {
    ...customer,
    totalSpent: toRands(totalCents(records)),
    currency: "ZAR",
  };
}
