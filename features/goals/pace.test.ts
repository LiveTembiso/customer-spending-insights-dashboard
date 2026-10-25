import { describe, expect, it } from "vitest";

import { makeGoal } from "@/test-utils/fixtures";

import {
  byUrgency,
  goalPace,
  isAheadOfPace,
  monthElapsedPercent,
} from "./pace";
import type { Goal } from "./schemas";

const goal = (overrides: Partial<Goal>): Goal =>
  makeGoal({ currentSpent: 400, percentageUsed: 40, ...overrides });

describe("monthElapsedPercent", () => {
  it("starts the month at midnight in SAST", () => {
    // 1 Oct 00:00 SAST is 30 Sep 22:00 UTC.
    expect(monthElapsedPercent(new Date("2026-09-30T22:00:00Z"))).toBe(0);
  });

  it("stays under 100 at the last instant of the month", () => {
    // 31 Oct 23:59:59.999 SAST.
    const elapsed = monthElapsedPercent(new Date("2026-10-31T21:59:59.999Z"));
    expect(elapsed).toBeLessThan(100);
    expect(elapsed).toBeGreaterThan(99.99);
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

  it("has no daily allowance when it would be under a cent", () => {
    expect(goalPace(goal({ currentSpent: 999.95 })).perDay).toBeNull();
    expect(goalPace(goal({ currentSpent: 999.9 })).perDay).toBe(0.01);
  });

  it("has no daily allowance once the budget is used exactly", () => {
    expect(goalPace(goal({ currentSpent: 1000 })).perDay).toBeNull();
  });
});

describe("isAheadOfPace", () => {
  it("allows ten points ahead of the month before it counts", () => {
    expect(isAheadOfPace(60, 50)).toBe(false);
    expect(isAheadOfPace(60.1, 50)).toBe(true);
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
