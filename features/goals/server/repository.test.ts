import { describe, expect, it } from "vitest";

import { goalsResponseSchema } from "../schemas";
import { getGoals, goalStatus } from "./repository";

const NOW = new Date("2026-10-14T06:00:00Z");

describe("getGoals", () => {
  it("returns undefined for an unknown customer", () => {
    expect(getGoals("99999", NOW)).toBeUndefined();
  });

  it("tracks this month's spending against each budget", () => {
    const { goals } = goalsResponseSchema.parse(getGoals("12345", NOW));

    expect(goals.length).toBeGreaterThan(0);
    for (const goal of goals) {
      expect(goal.daysRemaining).toBe(17);
      expect(goal.percentageUsed).toBeCloseTo(
        (goal.currentSpent / goal.monthlyBudget) * 100,
        1,
      );
    }
  });
});

describe("goalStatus", () => {
  it.each([
    { used: 40, elapsed: 50, status: "on_track" },
    { used: 59, elapsed: 50, status: "on_track" },
    { used: 61, elapsed: 50, status: "warning" },
    { used: 92, elapsed: 95, status: "warning" },
    { used: 100, elapsed: 100, status: "warning" },
    { used: 100.1, elapsed: 100, status: "exceeded" },
  ])("is $status at $used% used, $elapsed% through the month", (row) => {
    expect(goalStatus(row.used, row.elapsed)).toBe(row.status);
  });
});
