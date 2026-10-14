import "server-only";

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
    totalSpent: toRands(records.reduce((sum, r) => sum + r.amount, 0)),
    currency: "ZAR",
  };
}
