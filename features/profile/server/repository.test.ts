import { describe, expect, it } from "vitest";

import { transactionsQuerySchema } from "@/features/transactions/schemas";
import { listTransactions } from "@/features/transactions/server/repository";

import { profileResponseSchema } from "../schemas";
import { getProfile } from "./repository";

const NOW = new Date("2026-10-14T06:00:00Z");

function sumAllTransactions(customerId: string) {
  let cents = 0;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = listTransactions(
      customerId,
      transactionsQuerySchema.parse({ limit: 100, offset }),
      NOW,
    )!;
    cents += page.transactions.reduce(
      (sum, t) => sum + Math.round(t.amount * 100),
      0,
    );
    offset += page.transactions.length;
    hasMore = page.pagination.hasMore;
  }

  return cents / 100;
}

describe("getProfile", () => {
  it("returns undefined for an unknown customer", () => {
    expect(getProfile("99999", NOW)).toBeUndefined();
  });

  it("totals every transaction since the customer joined", () => {
    const profile = profileResponseSchema.parse(getProfile("12345", NOW));

    expect(profile.totalSpent).toBe(sumAllTransactions("12345"));
    expect(profile.currency).toBe("ZAR");
  });
});
