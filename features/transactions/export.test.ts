import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchAllTransactions } from "./export";
import type { Transaction, TransactionsQuery } from "./schemas";

const query: TransactionsQuery = {
  limit: 10,
  offset: 20,
  category: "Groceries",
  sortBy: "date_desc",
  q: undefined,
};

const transaction = (id: number): Transaction => ({
  id: `txn_${id}`,
  date: "2026-10-16T22:30:00Z",
  merchant: "Pick n Pay",
  category: "Groceries",
  amount: 10,
  description: "Weekly groceries",
  paymentMethod: "Credit Card",
  icon: "shopping-cart",
  categoryColor: "#FF6B6B",
});

function page(from: number, count: number, total: number) {
  return new Response(
    JSON.stringify({
      transactions: Array.from({ length: count }, (_, i) =>
        transaction(from + i),
      ),
      pagination: {
        total,
        limit: 100,
        offset: from,
        hasMore: from + count < total,
      },
    }),
  );
}

const offsets = (fetch: ReturnType<typeof vi.fn>) =>
  fetch.mock.calls.map(([url]) =>
    new URL(String(url), "http://test").searchParams.get("offset"),
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAllTransactions", () => {
  it("pages through every match, 100 at a time", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(page(0, 100, 150))
      .mockResolvedValueOnce(page(100, 50, 150));
    vi.stubGlobal("fetch", fetch);

    const all = await fetchAllTransactions("12345", query);

    expect(all).toHaveLength(150);
    expect(offsets(fetch)).toEqual(["0", "100"]);
    expect(String(fetch.mock.calls[0][0])).toContain("category=Groceries");
    expect(String(fetch.mock.calls[0][0])).toContain("limit=100");
  });

  it("stops on an empty page even if the server says there's more", async () => {
    const empty = new Response(
      JSON.stringify({
        transactions: [],
        pagination: { total: 5, limit: 100, offset: 0, hasMore: true },
      }),
    );
    const fetch = vi.fn().mockResolvedValueOnce(empty);
    vi.stubGlobal("fetch", fetch);

    expect(await fetchAllTransactions("12345", query)).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
