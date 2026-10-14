import "server-only";

import type { CategoryName } from "@/features/categories/schemas";
import { getCustomerTransactions } from "@/features/transactions/server/store";
import { dayOfMonth, daysInMonth, toDayKey, toMonthKey } from "@/lib/dates";
import { roundTo, toRands } from "@/lib/money";

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
  const today = dayOfMonth(toDayKey(now));
  const monthLength = daysInMonth(month);
  const monthElapsed = (today / monthLength) * 100;
  const thisMonth = records.filter((record) => record.day.startsWith(month));

  return {
    goals: (BUDGETS[customerId] ?? []).map((budget) => {
      const spent = thisMonth
        .filter((record) => record.category === budget.category)
        .reduce((sum, record) => sum + record.amount, 0);
      const percentageUsed = roundTo(
        (toRands(spent) / budget.monthlyBudget) * 100,
        1,
      );

      return {
        id: budget.id,
        category: budget.category,
        monthlyBudget: budget.monthlyBudget,
        currentSpent: toRands(spent),
        percentageUsed,
        daysRemaining: monthLength - today,
        status: goalStatus(percentageUsed, monthElapsed),
      };
    }),
  };
}
