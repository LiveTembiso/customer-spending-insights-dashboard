import { describe, expect, it, vi } from "vitest";

import { getCurrentMonthCategories } from "@/features/spending/server/current";

import type { Goal } from "../schemas";
import {
  getCurrentGoalsProgress,
  getCurrentUntrackedSpending,
} from "./current";
import { getGoals } from "./repository";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("./repository", () => ({ getGoals: vi.fn() }));
vi.mock("@/features/spending/server/current", () => ({
  getCurrentMonthCategories: vi.fn(),
}));

const goal = (overrides: Partial<Goal>): Goal => ({
  id: "goal_001",
  category: "Groceries",
  monthlyBudget: 1000,
  currentSpent: 500,
  percentageUsed: 50,
  daysRemaining: 10,
  status: "on_track",
  ...overrides,
});

const spend = (
  name: "Groceries" | "Transportation" | "Shopping",
  amount: number,
) => ({
  name,
  amount,
  percentage: 0,
  transactionCount: amount > 0 ? 1 : 0,
  color: "#FF6B6B",
  icon: "shopping-cart" as const,
});

describe("getCurrentGoalsProgress", () => {
  it("puts the most urgent goal first", async () => {
    vi.mocked(getGoals).mockReturnValue({
      goals: [
        goal({ id: "goal_a" }),
        goal({ id: "goal_b", status: "warning", percentageUsed: 91 }),
      ],
    });
    const progress = await getCurrentGoalsProgress();
    expect(progress?.goals.map((g) => g.id)).toEqual(["goal_b", "goal_a"]);
  });
});

describe("getCurrentUntrackedSpending", () => {
  it("keeps categories with spend and no goal", async () => {
    vi.mocked(getGoals).mockReturnValue({ goals: [goal({})] });
    vi.mocked(getCurrentMonthCategories).mockResolvedValue({
      dateRange: { startDate: "2026-10-01", endDate: "2026-10-21" },
      totalAmount: 900,
      categories: [
        spend("Groceries", 500),
        spend("Transportation", 400),
        spend("Shopping", 0),
      ],
    });
    const untracked = await getCurrentUntrackedSpending();
    expect(untracked?.categories.map((c) => c.name)).toEqual([
      "Transportation",
    ]);
  });
});
