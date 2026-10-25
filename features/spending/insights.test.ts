import { describe, expect, it } from "vitest";

import type { Goal } from "@/features/goals/schemas";
import { makeCategorySpend, makeGoal } from "@/test-utils/fixtures";

import { formatMetric, monthStats, standOut, vsAverage } from "./insights";
import type { CategorySpend, MonthlyTrend } from "./schemas";

const month = (
  key: string,
  totalSpent: number,
  transactionCount: number,
): MonthlyTrend => ({
  month: key,
  totalSpent,
  transactionCount,
  averageTransaction:
    transactionCount === 0
      ? 0
      : Math.round((totalSpent / transactionCount) * 100) / 100,
});

const trends = [
  month("2026-05", 4000, 40),
  month("2026-06", 5000, 50),
  month("2026-07", 3000, 20),
  month("2026-08", 4000, 40),
  month("2026-09", 4400, 44),
  month("2026-10", 9000, 30),
];

const category = (
  name: CategorySpend["name"],
  amount: number,
  transactionCount: number,
): CategorySpend =>
  makeCategorySpend({ name, amount, transactionCount, percentage: 0 });

const goal: Goal = makeGoal({
  monthlyBudget: 5500,
  currentSpent: 5318,
  percentageUsed: 96.7,
  daysRemaining: 12,
  status: "warning",
});

describe("monthStats", () => {
  it("leaves the current month out of the average and the highest", () => {
    const stats = monthStats(trends, "total");
    expect(stats.current.month).toBe("2026-10");
    expect(stats.full).toHaveLength(5);
    expect(stats.average).toBe(4080);
    expect(stats.highest?.month).toBe("2026-06");
  });

  it("averages transactions per purchase across months, not per month", () => {
    // 20 400 over 194 purchases, rather than the mean of the monthly averages.
    expect(monthStats(trends, "average").average).toBe(105.15);
    expect(monthStats(trends, "average").highest?.month).toBe("2026-07");
  });

  it("averages counts", () => {
    expect(monthStats(trends, "count").average).toBe(38.8);
  });

  it("has no average or highest without a full month", () => {
    const stats = monthStats([month("2026-10", 100, 1)], "total");
    expect(stats.average).toBeNull();
    expect(stats.highest).toBeUndefined();
  });

  it("has no highest when every full month is empty", () => {
    const stats = monthStats(
      [month("2026-09", 0, 0), month("2026-10", 10, 1)],
      "total",
    );
    expect(stats.highest).toBeUndefined();
  });
});

describe("vsAverage", () => {
  it("is the percentage above or below the average", () => {
    expect(vsAverage(4250.75, 4037.19)).toBe(5.3);
    expect(vsAverage(3750.6, 4037.19)).toBe(-7.1);
  });

  it("is null without an average to compare with", () => {
    expect(vsAverage(100, null)).toBeNull();
    expect(vsAverage(100, 0)).toBeNull();
  });
});

describe("formatMetric", () => {
  it("shows rands without cents and counts as whole numbers", () => {
    expect(formatMetric(4037.19, "total").replace(/\s/g, " ")).toBe("R4 037");
    expect(formatMetric(38.8, "count")).toBe("39");
  });
});

describe("standOut", () => {
  const categories = [
    category("Entertainment", 890.2, 8),
    category("Groceries", 1250.3, 15),
    category("Utilities", 458.7, 3),
    category("Shopping", 0, 0),
  ];

  it("picks the biggest category, with its goal", () => {
    const [top] = standOut(categories, [goal], trends);
    expect(top).toMatchObject({ kind: "top", goal });
    expect(top.kind === "top" && top.category.name).toBe("Groceries");
  });

  it("picks the category with the largest average purchase", () => {
    const notes = standOut(categories, [], trends);
    expect(notes[1]).toMatchObject({ kind: "largest", average: 152.9 });
  });

  it("skips the largest purchase when it's the biggest category too", () => {
    const notes = standOut([category("Groceries", 900, 2)], [], trends);
    expect(notes.map((note) => note.kind)).toEqual(["top", "month"]);
  });

  it("compares the last full month with the average", () => {
    const note = standOut(categories, [], trends).at(-1);
    expect(note).toMatchObject({
      kind: "month",
      average: 4080,
      months: 5,
      change: 7.8,
    });
    expect(note?.kind === "month" && note.month.month).toBe("2026-09");
  });

  it("has nothing to say with no spending and one month", () => {
    expect(standOut([], [], [month("2026-10", 0, 0)])).toEqual([]);
  });
});
