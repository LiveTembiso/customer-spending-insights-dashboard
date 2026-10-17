import { describe, expect, it } from "vitest";

import {
  categoriesQuerySchema,
  categoriesResponseSchema,
  summaryQuerySchema,
  summaryResponseSchema,
  trendsQuerySchema,
} from "./schemas";

describe("summaryQuerySchema", () => {
  it("defaults to 30 days", () => {
    expect(summaryQuerySchema.parse({})).toEqual({ period: "30d" });
  });

  it("rejects an unknown period", () => {
    expect(summaryQuerySchema.safeParse({ period: "2w" }).success).toBe(false);
  });
});

describe("summaryResponseSchema", () => {
  it("accepts a negative change", () => {
    const result = summaryResponseSchema.safeParse({
      period: "30d",
      totalSpent: 4250.75,
      transactionCount: 47,
      averageTransaction: 90.44,
      topCategory: "Groceries",
      comparedToPrevious: { spentChange: 12.5, transactionChange: -3.2 },
    });

    expect(result.success).toBe(true);
  });
});

describe("categoriesQuerySchema", () => {
  it("accepts a custom date range", () => {
    expect(
      categoriesQuerySchema.parse({
        startDate: "2024-08-16",
        endDate: "2024-09-16",
      }),
    ).toEqual({
      period: "30d",
      startDate: "2024-08-16",
      endDate: "2024-09-16",
    });
  });

  it("rejects a range with only one date", () => {
    expect(
      categoriesQuerySchema.safeParse({ startDate: "2024-08-16" }).success,
    ).toBe(false);
  });

  it("rejects a range that ends before it starts", () => {
    expect(
      categoriesQuerySchema.safeParse({
        startDate: "2024-09-16",
        endDate: "2024-08-16",
      }).success,
    ).toBe(false);
  });

  it("rejects an impossible date", () => {
    expect(
      categoriesQuerySchema.safeParse({
        startDate: "2024-02-30",
        endDate: "2024-03-01",
      }).success,
    ).toBe(false);
  });
});

describe("categoriesResponseSchema", () => {
  it("accepts a category breakdown", () => {
    const result = categoriesResponseSchema.safeParse({
      dateRange: { startDate: "2024-08-16", endDate: "2024-09-16" },
      totalAmount: 4250.75,
      categories: [
        {
          name: "Groceries",
          amount: 1250.3,
          percentage: 29.4,
          transactionCount: 15,
          color: "#FF6B6B",
          icon: "shopping-cart",
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe("trendsQuerySchema", () => {
  it("defaults to 12 months and coerces query strings", () => {
    expect(trendsQuerySchema.parse({})).toEqual({ months: 12 });
    expect(trendsQuerySchema.parse({ months: "6" })).toEqual({ months: 6 });
  });

  it.each(["0", "25", "1.5", "abc"])("rejects months=%s", (months) => {
    expect(trendsQuerySchema.safeParse({ months }).success).toBe(false);
  });
});
