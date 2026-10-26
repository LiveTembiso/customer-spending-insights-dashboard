import { describe, expect, it, vi } from "vitest";

import {
  type TransactionsQuery,
  transactionsQuerySchema,
  transactionsResponseSchema,
} from "../schemas";
import { listTransactions } from "./repository";
import * as store from "./store";
import type { TransactionRecord } from "./generate";

const NOW = new Date("2026-10-14T06:00:00Z");

function list(query: Partial<TransactionsQuery> = {}) {
  const response = listTransactions(
    "12345",
    transactionsQuerySchema.parse(query),
    NOW,
  );
  return transactionsResponseSchema.parse(response);
}

describe("listTransactions", () => {
  it("returns undefined for an unknown customer", () => {
    expect(
      listTransactions("99999", transactionsQuerySchema.parse({}), NOW),
    ).toBeUndefined();
  });

  it("returns the newest page first by default", () => {
    const { transactions, pagination } = list();
    const dates = transactions.map((t) => t.date);

    expect(transactions).toHaveLength(20);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(pagination).toMatchObject({ limit: 20, offset: 0, hasMore: true });
  });

  it("never returns transactions after now", () => {
    const [latest] = list({ limit: 1 }).transactions;

    expect(Date.parse(latest.date)).toBeLessThanOrEqual(NOW.getTime());
  });

  it("pages through results without overlap", () => {
    const first = list({ limit: 10 });
    const second = list({ limit: 10, offset: 10 });
    const ids = [...first.transactions, ...second.transactions].map(
      (t) => t.id,
    );

    expect(new Set(ids).size).toBe(20);
    expect(second.pagination.total).toBe(first.pagination.total);
  });

  it("reports no more pages at the end", () => {
    const { pagination } = list();
    const last = list({ limit: 20, offset: pagination.total - 5 });

    expect(last.transactions).toHaveLength(5);
    expect(last.pagination.hasMore).toBe(false);
  });

  it("filters by category and inclusive date range", () => {
    const { transactions } = list({
      category: "Groceries",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      limit: 100,
    });

    expect(transactions.length).toBeGreaterThan(0);
    for (const transaction of transactions) {
      expect(transaction.category).toBe("Groceries");
      // Compare in SAST: the date is UTC, so shift by two hours.
      const sastDay = new Date(Date.parse(transaction.date) + 7_200_000)
        .toISOString()
        .slice(0, 10);
      expect(sastDay >= "2026-09-01" && sastDay <= "2026-09-30").toBe(true);
    }
  });

  it("sorts by amount", () => {
    const amounts = list({ sortBy: "amount_desc", limit: 50 }).transactions.map(
      (t) => t.amount,
    );

    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });

  it("sorts oldest first when requested", () => {
    const dates = list({ sortBy: "date_asc", limit: 50 }).transactions.map(
      (t) => t.date,
    );
    expect(dates).toHaveLength(50);
    expect(dates).toEqual([...dates].sort());
  });

  it.each(["amount_asc", "amount_desc"] as const)(
    "uses newest-first tie breaking for equal amounts with %s",
    (sortBy) => {
      const record = (
        id: string,
        date: string,
        amount: number,
      ): TransactionRecord => ({
        id: `txn_${id}`,
        timestamp: Date.parse(date),
        day: date.slice(0, 10),
        amount,
        merchant: "Test shop",
        category: "Groceries",
        description: "Groceries",
        paymentMethod: "Debit Card",
      });
      vi.spyOn(store, "getCustomerTransactions").mockReturnValue([
        record("older", "2026-10-10T06:00:00Z", 10000),
        record("smallest", "2026-10-12T06:00:00Z", 100),
        record("newer", "2026-10-11T06:00:00Z", 10000),
        record("largest", "2026-10-13T06:00:00Z", 20000),
      ]);
      const ids = list({ sortBy }).transactions.map((t) => t.id);
      expect(ids).toEqual(
        sortBy === "amount_asc"
          ? ["txn_smallest", "txn_newer", "txn_older", "txn_largest"]
          : ["txn_largest", "txn_newer", "txn_older", "txn_smallest"],
      );
    },
  );

  it("searches merchant and description, ignoring case", () => {
    const byMerchant = list({ q: "netflix", limit: 100 }).transactions;
    const byDescription = list({ q: "FUEL", limit: 100 }).transactions;

    expect(byMerchant.length).toBeGreaterThan(0);
    expect(byMerchant.every((t) => t.merchant === "Netflix")).toBe(true);
    expect(byDescription.every((t) => t.description === "Fuel")).toBe(true);
  });
});
