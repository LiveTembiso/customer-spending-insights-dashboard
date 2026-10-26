import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentMonthCategories } from "@/features/spending/server/current";
import { makeCategories, makeGoal as goal } from "@/test-utils/fixtures";

import {
  getCurrentGoalsProgress,
  getCurrentGoals,
  getCurrentUntrackedSpending,
} from "./current";
import { getGoals } from "./repository";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: "customer-test" },
}));
vi.mock("./repository", () => ({ getGoals: vi.fn() }));
vi.mock("@/features/spending/server/current", () => ({
  getCurrentMonthCategories: vi.fn(),
}));

afterEach(() => vi.useRealTimers());

describe("getCurrentGoals", () => {
  it("returns the signed-in customer's goals at the current request time", async () => {
    const now = new Date("2026-09-30T22:30:00Z");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    const response = { goals: [goal({})] };
    vi.mocked(getGoals).mockReturnValue(response);
    expect(await getCurrentGoals()).toBe(response);
    expect(getGoals).toHaveBeenCalledWith("customer-test", now);
  });
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
  it("does not manufacture progress for an unavailable customer", async () => {
    vi.mocked(getGoals).mockReturnValue(undefined);
    expect(await getCurrentGoalsProgress()).toBeUndefined();
  });

  it("puts the most urgent goal first", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T10:00:00Z"));
    const response = {
      goals: [
        goal({ id: "goal_a" }),
        goal({ id: "goal_b", status: "warning", percentageUsed: 91 }),
      ],
    };
    vi.mocked(getGoals).mockReturnValue(response);
    const progress = await getCurrentGoalsProgress();
    expect(progress?.goals.map((g) => g.id)).toEqual(["goal_b", "goal_a"]);
    expect(progress).toMatchObject({ today: "2026-10-16", monthElapsed: 50 });
    expect(response.goals.map((g) => g.id)).toEqual(["goal_a", "goal_b"]);
  });
});

describe("getCurrentUntrackedSpending", () => {
  it("returns unavailable when goals cannot be loaded", async () => {
    vi.mocked(getGoals).mockReturnValue(undefined);
    vi.mocked(getCurrentMonthCategories).mockResolvedValue(makeCategories());
    expect(await getCurrentUntrackedSpending()).toBeUndefined();
  });

  it("returns unavailable when category spending cannot be loaded", async () => {
    vi.mocked(getGoals).mockReturnValue({ goals: [goal({})] });
    vi.mocked(getCurrentMonthCategories).mockResolvedValue(undefined);
    expect(await getCurrentUntrackedSpending()).toBeUndefined();
  });

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
