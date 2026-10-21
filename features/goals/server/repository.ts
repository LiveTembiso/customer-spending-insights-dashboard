import "server-only";

import type { CategoryName } from "@/features/categories/schemas";
import { inMonth, totalCents } from "@/features/transactions/server/records";
import { getCustomerTransactions } from "@/features/transactions/server/store";
import { dayOfMonth, daysInMonth, toDayKey, toMonthKey } from "@/lib/dates";
import { roundTo, toRands } from "@/lib/money";

import { monthElapsedPercent } from "../pace";
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
const PACE_TOLERANCE = 10;

export function goalStatus(
  percentageUsed: number,
  monthElapsed: number,
): GoalStatus {
  if (percentageUsed > 100) return "exceeded";
  if (
    percentageUsed >= WARNING_THRESHOLD ||
    percentageUsed > monthElapsed + PACE_TOLERANCE
  ) {
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
      // Status uses the exact ratio; only the reported value is rounded.
      const used = (toRands(spent) / budget.monthlyBudget) * 100;

      return {
        id: budget.id,
        category: budget.category,
        monthlyBudget: budget.monthlyBudget,
        currentSpent: toRands(spent),
        percentageUsed: roundTo(used, 1),
        daysRemaining,
        status: goalStatus(used, monthElapsed),
      };
    }),
  };
}
