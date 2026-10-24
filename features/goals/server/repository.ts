import "server-only";

import type { CategoryName } from "@/features/categories/schemas";
import { inMonth, totalCents } from "@/features/transactions/server/records";
import { getCustomerTransactions } from "@/features/transactions/server/store";
import { dayOfMonth, daysInMonth, toDayKey, toMonthKey } from "@/lib/dates";
import { type Cents, roundTo, toRands } from "@/lib/money";

import { isAheadOfPace, monthElapsedPercent } from "../pace";
import type { GoalStatus, GoalsResponse } from "../schemas";

interface Budget {
  id: string;
  category: CategoryName;
  monthlyBudget: number;
}

const BUDGETS: Record<string, readonly Budget[]> = {
  "12345": [
    { id: "goal_001", category: "Groceries", monthlyBudget: 5500 },
    { id: "goal_002", category: "Entertainment", monthlyBudget: 900 },
    { id: "goal_003", category: "Dining", monthlyBudget: 4500 },
  ],
};

const WARNING_THRESHOLD = 90;

/** Share of the budget used, to one decimal, as the API reports it. */
export function percentUsed(spent: Cents, monthlyBudget: number): number {
  return roundTo((toRands(spent) / monthlyBudget) * 100, 1);
}

export function goalStatus(
  spent: Cents,
  monthlyBudget: number,
  monthElapsed: number,
): GoalStatus {
  // A cent over is over, even though it still shows as 100.0%.
  if (spent > monthlyBudget * 100) return "exceeded";
  // Otherwise the rounded figure decides, so 89.96% shown as 90% isn't "On track".
  const used = percentUsed(spent, monthlyBudget);
  if (used >= WARNING_THRESHOLD || isAheadOfPace(used, monthElapsed)) {
    return "warning";
  }
  return "on_track";
}

export function getGoals(
  customerId: string,
  now: Date,
): GoalsResponse | undefined {
  const records = getCustomerTransactions(customerId, now);
  if (!records) return undefined;

  const month = toMonthKey(now);
  const monthLength = daysInMonth(month);
  const monthElapsed = monthElapsedPercent(now);
  // Today still counts as a day left to spend in.
  const daysRemaining = monthLength - dayOfMonth(toDayKey(now)) + 1;
  const thisMonth = inMonth(records, month);

  return {
    goals: (BUDGETS[customerId] ?? []).map((budget) => {
      const spent = totalCents(
        thisMonth.filter((record) => record.category === budget.category),
      );
      return {
        id: budget.id,
        category: budget.category,
        monthlyBudget: budget.monthlyBudget,
        currentSpent: toRands(spent),
        percentageUsed: percentUsed(spent, budget.monthlyBudget),
        daysRemaining,
        status: goalStatus(spent, budget.monthlyBudget, monthElapsed),
      };
    }),
  };
}
