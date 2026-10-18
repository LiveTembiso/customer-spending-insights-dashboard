import { describe, expect, it } from "vitest";

import {
  categoriesQuerySchema,
  categoriesResponseSchema,
  summaryResponseSchema,
  trendsResponseSchema,
} from "../schemas";
import {
  previousPeriodCutoff,
  periodRange,
  previousPeriodRange,
} from "./periods";
import {
  getCategoryBreakdown,
  getMonthToDate,
  getSummary,
  getTrends,
} from "./repository";

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

describe("previousPeriodCutoff", () => {
  it("compares with the same time of day one period ago", () => {
    expect(new Date(previousPeriodCutoff("7d", NOW)).toISOString()).toBe(
      "2026-10-07T06:00:00.000Z",
    );
  });
});

describe("getSummary", () => {
  it("has no top category or comparison before any spending", () => {
    const summary = summaryResponseSchema.parse(
      getSummary("12345", { period: "7d" }, new Date("2023-01-10T10:00:00Z")),
    );

    expect(summary).toMatchObject({
      totalSpent: 0,
      topCategory: null,
      comparedToPrevious: { spentChange: 0, transactionChange: 0 },
    });
  });

  it("can't compare a first week with the empty one before it", () => {
    const summary = summaryResponseSchema.parse(
      getSummary("12345", { period: "7d" }, new Date("2023-01-20T10:00:00Z")),
    );

    expect(summary.totalSpent).toBeGreaterThan(0);
    expect(summary.comparedToPrevious.spentChange).toBeNull();
  });

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

describe("getMonthToDate", () => {
  it("compares this month so far with the same days of last month", () => {
    const result = getMonthToDate("12345", NOW);

    expect(result?.range).toEqual({ start: "2026-10-01", end: "2026-10-14" });
    expect(result?.previousRange).toEqual({
      start: "2026-09-01",
      end: "2026-09-14",
    });
  });

  it("uses all of a shorter last month", () => {
    const result = getMonthToDate("12345", new Date("2026-03-30T08:00:00Z"));

    expect(result?.previousRange).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
  });

  it("matches the transactions in its range", () => {
    const result = getMonthToDate("12345", NOW);
    const breakdown = getCategoryBreakdown(
      "12345",
      { period: "30d", startDate: "2026-10-01", endDate: "2026-10-14" },
      NOW,
    );

    expect(result?.totalSpent).toBe(breakdown?.totalAmount);
    expect(result?.transactionCount).toBe(
      breakdown?.categories.reduce((sum, c) => sum + c.transactionCount, 0),
    );
  });

  it("can't compare with a month that had no spending", () => {
    const result = getMonthToDate("12345", new Date("2023-01-20T10:00:00Z"));

    expect(result?.comparedToPrevious).toEqual({
      spentChange: null,
      transactionChange: null,
    });
  });

  it("is undefined for an unknown customer", () => {
    expect(getMonthToDate("nope", NOW)).toBeUndefined();
  });
});
