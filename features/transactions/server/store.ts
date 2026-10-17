import "server-only";

import { findCustomer } from "@/features/profile/server/customers";
import { toDayKey } from "@/lib/dates";
import { env } from "@/lib/env";

import { generateTransactions, type TransactionRecord } from "./generate";

// Generated history is cached per customer and regenerated once a day.
const cache = new Map<
  string,
  { through: string; records: TransactionRecord[] }
>();

/**
 * All of a customer's transactions up to `now`, oldest first, or `undefined`
 * if the customer doesn't exist.
 */
export function getCustomerTransactions(
  customerId: string,
  now: Date,
): TransactionRecord[] | undefined {
  const customer = findCustomer(customerId);
  if (!customer) return undefined;

  const today = toDayKey(now);
  let entry = cache.get(customerId);

  if (entry?.through !== today) {
    entry = {
      through: today,
      records: generateTransactions({
        seed: env.MOCK_DATA_SEED,
        customerId,
        from: customer.joinDate,
        to: today,
      }),
    };
    cache.set(customerId, entry);
  }

  // Today's history is generated in full; hide anything later than now.
  const nowMs = now.getTime();
  const end = entry.records.findLastIndex(
    (record) => record.timestamp <= nowMs,
  );
  return entry.records.slice(0, end + 1);
}
