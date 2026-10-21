import { describe, expect, it } from "vitest";

import { byUrgency, goalPace, monthElapsedPercent } from "./pace";
import type { Goal } from "./schemas";

const goal = (overrides: Partial<Goal>): Goal => ({
  id: "goal_001",
  category: "Groceries",
  monthlyBudget: 1000,
  currentSpent: 400,
  percentageUsed: 40,
  daysRemaining: 10,
  status: "on_track",
  ...overrides,
});

describe("monthElapsedPercent", () => {
  it("starts the month at midnight in SAST", () => {
    // 1 Oct 00:00 SAST is 30 Sep 22:00 UTC.
    expect(monthElapsedPercent(new Date("2026-09-30T22:00:00Z"))).toBe(0);
  });

  it("counts part of today", () => {
    // Noon on 16 Oct: 15.5 of 31 days.
    expect(monthElapsedPercent(new Date("2026-10-16T10:00:00Z"))).toBeCloseTo(
      50,
      5,
    );
  });
});

describe("goalPace", () => {
  it("splits what's left over the days remaining", () => {
    expect(goalPace(goal({}))).toEqual({ left: 600, over: 0, perDay: 60 });
  });

  it("reports an overspend and no daily allowance", () => {
    expect(goalPace(goal({ currentSpent: 1120 }))).toEqual({
      left: 0,
      over: 120,
      perDay: null,
    });
  });

  it("has no daily allowance once the budget is used exactly", () => {
    expect(goalPace(goal({ currentSpent: 1000 })).perDay).toBeNull();
  });
});

describe("byUrgency", () => {
  it("puts overspent goals first, then warnings, then the rest", () => {
    const goals = [
      goal({ id: "goal_a", status: "on_track", percentageUsed: 80 }),
      goal({ id: "goal_b", status: "warning", percentageUsed: 91 }),
      goal({ id: "goal_c", status: "exceeded", percentageUsed: 104 }),
      goal({ id: "goal_d", status: "warning", percentageUsed: 95 }),
    ];
    expect(goals.toSorted(byUrgency).map((g) => g.id)).toEqual([
      "goal_c",
      "goal_d",
      "goal_b",
      "goal_a",
    ]);
  });
});
