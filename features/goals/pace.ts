import { DAY_MS, daysInMonth, startOfDay, toMonthKey } from "@/lib/dates";

import type { Goal, GoalStatus } from "./schemas";

/** How much of this SAST month has gone, 0–100, counting today in part. */
export function monthElapsedPercent(now: Date): number {
  const month = toMonthKey(now);
  const start = startOfDay(`${month}-01`).getTime();
  return ((now.getTime() - start) / (daysInMonth(month) * DAY_MS)) * 100;
}

const PACE_TOLERANCE = 10;

/** Used noticeably more of the budget than of the month. */
export function isAheadOfPace(
  percentageUsed: number,
  monthElapsed: number,
): boolean {
  return percentageUsed > monthElapsed + PACE_TOLERANCE;
}

export interface GoalPace {
  left: number;
  over: number;
  /** What can still be spent each day, or null once the budget is used up. */
  perDay: number | null;
}

export function goalPace(goal: Goal): GoalPace {
  // In whole cents, so float noise can't decide whether anything is left.
  const balance = Math.round((goal.monthlyBudget - goal.currentSpent) * 100);
  const leftCents = Math.max(balance, 0);
  const centsPerDay =
    goal.daysRemaining > 0 ? leftCents / goal.daysRemaining : 0;
  return {
    left: leftCents / 100,
    over: Math.max(-balance, 0) / 100,
    // Under a cent a day is nothing to spend.
    perDay: centsPerDay >= 1 ? centsPerDay / 100 : null,
  };
}

const URGENCY: Record<GoalStatus, number> = {
  exceeded: 0,
  warning: 1,
  on_track: 2,
};

/** Overspent first, then warnings, each by how much of the budget is used. */
export function byUrgency(a: Goal, b: Goal): number {
  return (
    URGENCY[a.status] - URGENCY[b.status] || b.percentageUsed - a.percentageUsed
  );
}
