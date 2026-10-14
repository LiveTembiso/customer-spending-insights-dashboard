import { describe, expect, it } from "vitest";

import { goalsResponseSchema } from "./schemas";

const goal = {
  id: "goal_001",
  category: "Entertainment",
  monthlyBudget: 1000,
  currentSpent: 650.3,
  percentageUsed: 65,
  daysRemaining: 12,
  status: "on_track",
};

describe("goalsResponseSchema", () => {
  it("accepts a goal from the contract", () => {
    expect(goalsResponseSchema.safeParse({ goals: [goal] }).success).toBe(true);
  });

  it("accepts an overspent goal", () => {
    const overspent = {
      ...goal,
      currentSpent: 1200,
      percentageUsed: 120,
      status: "exceeded",
    };

    expect(goalsResponseSchema.safeParse({ goals: [overspent] }).success).toBe(
      true,
    );
  });

  it("rejects an unknown status", () => {
    expect(
      goalsResponseSchema.safeParse({ goals: [{ ...goal, status: "great" }] })
        .success,
    ).toBe(false);
  });
});
