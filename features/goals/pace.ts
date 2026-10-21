import { daysInMonth, startOfDay, toMonthKey } from "@/lib/dates";

import type { Goal, GoalStatus } from "./schemas";

const DAY_MS = 24 * 60 * 60 * 1000;

/** How much of this SAST month has gone, 0–100, counting today in part. */
export function monthElapsedPercent(now: Date): number {
  const month = toMonthKey(now);
  const start = startOfDay(`${month}-01`).getTime();
  return ((now.getTime() - start) / (daysInMonth(month) * DAY_MS)) * 100;
}

export interface GoalPace {
  left: number;
  over: number;
  /** What can still be spent each day, or null once the budget is used up. */
  perDay: number | null;
}

export function goalPace(goal: Goal): GoalPace {
  const left = Math.max(goal.monthlyBudget - goal.currentSpent, 0);
  return {
    left,
    over: Math.max(goal.currentSpent - goal.monthlyBudget, 0),
    perDay:
      left > 0 && goal.daysRemaining > 0 ? left / goal.daysRemaining : null,
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
