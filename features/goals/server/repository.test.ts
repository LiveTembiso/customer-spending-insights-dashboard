import { describe, expect, it } from "vitest";

import { goalsResponseSchema } from "../schemas";
import { getGoals, goalStatus, percentUsed } from "./repository";

const NOW = new Date("2026-10-14T06:00:00Z");

describe("getGoals", () => {
  it("returns undefined for an unknown customer", () => {
    expect(getGoals("99999", NOW)).toBeUndefined();
  });

  it("tracks this month's spending against each budget", () => {
    const { goals } = goalsResponseSchema.parse(getGoals("12345", NOW));

    expect(goals.length).toBeGreaterThan(0);
    for (const goal of goals) {
      expect(goal.daysRemaining).toBe(18);
      expect(goal.percentageUsed).toBeCloseTo(
        (goal.currentSpent / goal.monthlyBudget) * 100,
        1,
      );
    }
  });

  it("counts the last day of the month as a day remaining", () => {
    const { goals } = goalsResponseSchema.parse(
      getGoals("12345", new Date("2026-10-31T06:00:00Z")),
    );

    expect(goals[0].daysRemaining).toBe(1);
  });
});

describe("goalStatus", () => {
  // Against a R1 000 budget, so 1 000 cents is 1%.
  it.each([
    { spent: 40_000, elapsed: 50, status: "on_track" },
    { spent: 59_000, elapsed: 50, status: "on_track" },
    { spent: 61_000, elapsed: 50, status: "warning" },
    { spent: 92_000, elapsed: 95, status: "warning" },
    // Shown as 90.0%, so it can't be "On track".
    { spent: 89_960, elapsed: 85, status: "warning" },
    { spent: 100_000, elapsed: 100, status: "warning" },
    { spent: 100_100, elapsed: 100, status: "exceeded" },
    // Shown as 100.0%, but still over budget.
    { spent: 100_036, elapsed: 100, status: "exceeded" },
  ])("is $status at $spent cents spent, $elapsed% through the month", (row) => {
    expect(goalStatus(row.spent, 1000, row.elapsed)).toBe(row.status);
  });
});

describe("percentUsed", () => {
  it("rounds to one decimal", () => {
    expect(percentUsed(100_036, 1000)).toBe(100);
    expect(percentUsed(89_960, 1000)).toBe(90);
  });
});
