import { describe, expect, it } from "vitest";

import {
  categoriesQuerySchema,
  categoriesResponseSchema,
  summaryResponseSchema,
  trendsResponseSchema,
} from "../schemas";
import { periodRange, previousPeriodRange } from "./periods";
import { getCategoryBreakdown, getSummary, getTrends } from "./repository";

const NOW = new Date("2026-10-14T06:00:00Z");

describe("periods", () => {
  it("ends a period today and counts today as its first day", () => {
    expect(periodRange("7d", NOW)).toEqual({
      start: "2026-10-08",
      end: "2026-10-14",
    });
  });

  it("puts the previous period directly before the current one", () => {
    expect(previousPeriodRange("7d", NOW)).toEqual({
      start: "2026-10-01",
      end: "2026-10-07",
    });
  });
});

describe("getSummary", () => {
  it("returns undefined for an unknown customer", () => {
    expect(getSummary("99999", { period: "30d" }, NOW)).toBeUndefined();
  });

  it.each(["7d", "30d", "90d", "1y"] as const)(
    "matches the contract and the category totals for %s",
    (period) => {
      const summary = summaryResponseSchema.parse(
        getSummary("12345", { period }, NOW),
      );
      const breakdown = categoriesResponseSchema.parse(
        getCategoryBreakdown(
          "12345",
          categoriesQuerySchema.parse({ period }),
          NOW,
        ),
      );

      expect(summary.totalSpent).toBe(breakdown.totalAmount);
      expect(summary.topCategory).toBe(breakdown.categories[0].name);
      expect(summary.transactionCount).toBe(
        breakdown.categories.reduce((sum, c) => sum + c.transactionCount, 0),
      );
    },
  );
});

describe("getCategoryBreakdown", () => {
  it("lists every category, largest first, with shares adding up to 100%", () => {
    const { categories } = categoriesResponseSchema.parse(
      getCategoryBreakdown("12345", categoriesQuerySchema.parse({}), NOW),
    );
    const amounts = categories.map((c) => c.amount);
    const shares = categories.reduce((sum, c) => sum + c.percentage, 0);

    expect(categories).toHaveLength(6);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    expect(shares).toBeCloseTo(100, 0);
  });

  it("uses a custom range when both dates are given", () => {
    const response = getCategoryBreakdown(
      "12345",
      categoriesQuerySchema.parse({
        startDate: "2026-09-01",
        endDate: "2026-09-30",
      }),
      NOW,
    );

    expect(response?.dateRange).toEqual({
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });
  });
});

describe("getTrends", () => {
  it("returns the requested months, oldest first, ending this month", () => {
    const { trends } = trendsResponseSchema.parse(
      getTrends("12345", { months: 6 }, NOW),
    );

    expect(trends.map((t) => t.month)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
  });

  it("returns empty months before the customer joined", () => {
    const { trends } = trendsResponseSchema.parse(
      getTrends("12345", { months: 24 }, new Date("2023-06-01T10:00:00Z")),
    );

    expect(trends[0]).toMatchObject({
      month: "2021-07",
      totalSpent: 0,
      transactionCount: 0,
      averageTransaction: 0,
    });
  });
});
