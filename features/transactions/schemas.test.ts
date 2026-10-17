import { describe, expect, it } from "vitest";

import { transactionsQuerySchema, transactionsResponseSchema } from "./schemas";

describe("transactionsQuerySchema", () => {
  it("applies the contract defaults", () => {
    expect(transactionsQuerySchema.parse({})).toEqual({
      limit: 20,
      offset: 0,
      sortBy: "date_desc",
    });
  });

  it("coerces paging values from the query string", () => {
    expect(
      transactionsQuerySchema.parse({ limit: "50", offset: "100" }),
    ).toMatchObject({ limit: 50, offset: 100 });
  });

  it.each([
    { limit: "0" },
    { limit: "101" },
    { offset: "-1" },
    { sortBy: "merchant_asc" },
    { category: "Travel" },
  ])("rejects %o", (query) => {
    expect(transactionsQuerySchema.safeParse(query).success).toBe(false);
  });

  it("treats a blank search as no search", () => {
    expect(transactionsQuerySchema.parse({ q: "   " }).q).toBeUndefined();
  });

  it("trims the search term", () => {
    expect(transactionsQuerySchema.parse({ q: "  pick n pay " }).q).toBe(
      "pick n pay",
    );
  });
});

describe("transactionsResponseSchema", () => {
  it("accepts a page of transactions", () => {
    const result = transactionsResponseSchema.safeParse({
      transactions: [
        {
          id: "txn_123456",
          date: "2024-09-16T14:30:00Z",
          merchant: "Pick n Pay",
          category: "Groceries",
          amount: 245.8,
          description: "Weekly groceries",
          paymentMethod: "Credit Card",
          icon: "shopping-cart",
          categoryColor: "#FF6B6B",
        },
      ],
      pagination: { total: 1250, limit: 20, offset: 0, hasMore: true },
    });

    expect(result.success).toBe(true);
  });

  it("rejects a date without a timezone", () => {
    const result = transactionsResponseSchema.shape.transactions.element
      .pick({ date: true })
      .safeParse({ date: "2024-09-16T14:30:00" });

    expect(result.success).toBe(false);
  });
});
