import type { Goal } from "@/features/goals/schemas";
import type { ProfileResponse } from "@/features/profile/schemas";
import type {
  CategoriesResponse,
  CategorySpend,
  MonthlyTrend,
  SummaryResponse,
} from "@/features/spending/schemas";
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

export function makeSummary(
  overrides: Partial<SummaryResponse> = {},
): SummaryResponse {
  return {
    period: "30d",
    totalSpent: 100,
    transactionCount: 3,
    averageTransaction: 33.33,
    topCategory: "Groceries",
    comparedToPrevious: { spentChange: 5, transactionChange: 0 },
    ...overrides,
  };
}

export function makeCategories(
  overrides: Partial<CategoriesResponse> = {},
): CategoriesResponse {
  return {
    dateRange: { startDate: "2026-09-21", endDate: "2026-10-20" },
    totalAmount: 100,
    categories: [makeCategorySpend()],
    ...overrides,
  };
}

export function makeMonthlyTrend(
  overrides: Partial<MonthlyTrend> = {},
): MonthlyTrend {
  return {
    month: "2026-09",
    totalSpent: 100,
    transactionCount: 3,
    averageTransaction: 33.33,
    ...overrides,
  };
}

export function makeProfile(
  overrides: Partial<ProfileResponse> = {},
): ProfileResponse {
  return {
    customerId: "12345",
    name: "Lerato Mokoena",
    email: "lerato@example.com",
    joinDate: "2020-01-01",
    accountType: "Premium",
    totalSpent: 100,
    currency: "ZAR",
    ...overrides,
  };
}
