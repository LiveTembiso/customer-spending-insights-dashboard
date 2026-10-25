import type { Goal } from "@/features/goals/schemas";
import type { CategorySpend } from "@/features/spending/schemas";
import type { Transaction } from "@/features/transactions/schemas";

/** Fresh objects per test; overrides make each scenario explicit. */
export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal_001",
    category: "Groceries",
    monthlyBudget: 1000,
    currentSpent: 500,
    percentageUsed: 50,
    daysRemaining: 10,
    status: "on_track",
    ...overrides,
  };
}

export function makeWarningGoal(overrides: Partial<Goal> = {}): Goal {
  return makeGoal({
    monthlyBudget: 5500,
    currentSpent: 4473.12,
    percentageUsed: 81.3,
    daysRemaining: 11,
    status: "warning",
    ...overrides,
  });
}

export function makeTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "txn_001",
    date: "2026-10-20T06:14:00Z",
    merchant: "Pick n Pay",
    category: "Groceries",
    amount: 245.8,
    description: "Weekly groceries",
    paymentMethod: "Credit Card",
    icon: "shopping-cart",
    categoryColor: "#FF6B6B",
    ...overrides,
  };
}

export function makeCategorySpend(
  overrides: Partial<CategorySpend> = {},
): CategorySpend {
  return {
    name: "Groceries",
    amount: 100,
    percentage: 100,
    transactionCount: 3,
    color: "#FF6B6B",
    icon: "shopping-cart",
    ...overrides,
  };
}
