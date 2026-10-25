import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeWarningGoal as goal } from "@/test-utils/fixtures";
import { normalizedText as text } from "@/test-utils/text";

import type { Goal } from "../schemas";
import {
  getCurrentGoalsProgress,
  getCurrentUntrackedSpending,
} from "../server/current";
import {
  GoalsMonth,
  GoalsOverview,
  GoalsOverviewSkeleton,
} from "./goals-overview";
import { UntrackedSpending } from "./untracked-spending";

vi.mock("../server/current", () => ({
  getCurrentGoalsProgress: vi.fn(),
  getCurrentUntrackedSpending: vi.fn(),
}));

const goals = [
  goal({}),
  goal({
    id: "goal_003",
    category: "Dining",
    monthlyBudget: 4500,
    currentSpent: 3192.15,
    percentageUsed: 70.9,
    status: "on_track",
  }),
  goal({
    id: "goal_002",
    category: "Entertainment",
    monthlyBudget: 900,
    currentSpent: 367.99,
    percentageUsed: 40.9,
    status: "on_track",
  }),
];

async function renderOverview(list: Goal[]) {
  vi.mocked(getCurrentGoalsProgress).mockResolvedValue({
    goals: list,
    monthElapsed: 64.5,
    today: "2026-10-21",
  });
  render(await GoalsOverview());
}

describe("GoalsOverview", () => {
  it("omits unavailable data and offers placeholders while loading", async () => {
    vi.mocked(getCurrentGoalsProgress).mockResolvedValue(undefined);
    const { container, rerender } = render(await GoalsOverview());
    expect(container).toBeEmptyDOMElement();
    rerender(<GoalsOverviewSkeleton />);
    expect(container).not.toBeEmptyDOMElement();
    expect(screen.queryByText(/R[0-9]/)).not.toBeInTheDocument();
  });
  it("adds up the budgets and what's been spent against them", async () => {
    await renderOverview(goals);
    const summary = screen.getByRole("region", { name: /at a glance/ });
    expect(text(summary)).toContain("R10 900");
    expect(text(summary)).toContain("R8 033.26");
    expect(text(summary)).toContain("74% of your budgets");
  });

  it("names the goals that need attention", async () => {
    await renderOverview(goals);
    const summary = screen.getByRole("region", { name: /at a glance/ });
    expect(text(summary)).toContain("1 of 3");
    expect(text(summary)).toContain("Groceries is ahead of pace");
  });

  it("says a warning goal is nearly used up when it isn't ahead of pace", async () => {
    vi.mocked(getCurrentGoalsProgress).mockResolvedValue({
      goals: [goal({ percentageUsed: 92, currentSpent: 5060 })],
      monthElapsed: 95,
      today: "2026-10-30",
    });
    render(await GoalsOverview());
    expect(screen.getByText("Groceries is nearly used up")).toBeInTheDocument();
  });

  it("says when the goals needing attention are all over budget", async () => {
    await renderOverview([
      goal({ status: "exceeded", percentageUsed: 104, currentSpent: 5720 }),
    ]);
    expect(screen.getByText("Groceries over budget")).toBeInTheDocument();
  });

  it("names several goals that need a look", async () => {
    await renderOverview([
      goal({}),
      goal({ id: "goal_003", category: "Dining", status: "warning" }),
    ]);
    expect(
      screen.getByText("Groceries and Dining need a look"),
    ).toBeInTheDocument();
  });

  it("says when every goal is on track", async () => {
    await renderOverview(goals.slice(1));
    expect(screen.getByText("Every goal is on track")).toBeInTheDocument();
  });

  it("gives the worst goal a card when it needs attention, and lists the rest", async () => {
    await renderOverview(goals);
    expect(
      screen.getByRole("heading", { level: 2, name: "Groceries" }),
    ).toBeInTheDocument();
    const list = screen.getByRole("region", { name: "Your other goals" });
    expect(
      within(list)
        .getAllByRole("link")
        .map((link) => text(link)?.split("On track")[0].trim()),
    ).toEqual(["Dining", "Entertainment"]);
  });

  it("lists every goal, with no card, when all are on track", async () => {
    await renderOverview(goals.slice(1));
    const list = screen.getByRole("region", { name: "Your goals" });
    expect(within(list).getAllByRole("link")).toHaveLength(2);
    expect(
      screen.queryByRole("heading", { level: 2, name: "Dining" }),
    ).not.toBeInTheDocument();
  });

  it("says in each row what's left and what that allows per day", async () => {
    await renderOverview(goals);
    const row = within(
      screen.getByRole("region", { name: "Your other goals" }),
    ).getAllByRole("link")[0];
    expect(row).toHaveAccessibleName("Dining See purchases");
    // Money is grouped with non-breaking spaces, hence \s.
    expect(row).toHaveAccessibleDescription(
      /^On track R3\s192\.15 of R4\s500 · 71% used R1\s307\.85 left about R118 a day$/,
    );
    expect(text(row)).toContain("R3 192.15 of R4 500 · 71% used");
    expect(text(row)).toContain("R1 307.85 left about R118 a day");
    expect(row).toHaveAttribute(
      "href",
      "/transactions?category=Dining&period=custom&from=2026-10-01&to=2026-10-21",
    );
  });

  it("says so when no goals are set", async () => {
    await renderOverview([]);
    expect(screen.getByText("No goals set yet")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /at a glance/ }),
    ).not.toBeInTheDocument();
  });
});

describe("GoalsMonth", () => {
  it("omits an unavailable month and shows only the month when there are no goals", async () => {
    vi.mocked(getCurrentGoalsProgress).mockResolvedValue(undefined);
    expect(await GoalsMonth()).toBeNull();
    vi.mocked(getCurrentGoalsProgress).mockResolvedValue({
      goals: [],
      monthElapsed: 64.5,
      today: "2026-10-21",
    });
    expect(await GoalsMonth()).toBe("October");
  });
  it("names the month and the days left", async () => {
    vi.mocked(getCurrentGoalsProgress).mockResolvedValue({
      goals,
      monthElapsed: 64.5,
      today: "2026-10-21",
    });
    expect(await GoalsMonth()).toBe("October · 11 days left");
  });
});

describe("UntrackedSpending", () => {
  const spending = {
    dateRange: { startDate: "2026-10-01", endDate: "2026-10-21" },
    categories: [
      {
        name: "Transportation" as const,
        amount: 4012.14,
        percentage: 22.7,
        transactionCount: 9,
        color: "#45B7D1",
        icon: "car" as const,
      },
    ],
  };

  it("lists this month's spending outside the goals, linked to its purchases", async () => {
    vi.mocked(getCurrentUntrackedSpending).mockResolvedValue(spending);
    render(await UntrackedSpending());
    const link = within(
      screen.getByRole("region", { name: "Spending without a goal" }),
    ).getByRole("link");
    expect(link).toHaveAccessibleName("Transportation See purchases");
    expect(link).toHaveAccessibleDescription(/^9 transactions R4\s012\.14$/);
    expect(link).toHaveAttribute(
      "href",
      "/transactions?category=Transportation&period=custom&from=2026-10-01&to=2026-10-21",
    );
  });

  it("says so when there's nothing outside the goals", async () => {
    vi.mocked(getCurrentUntrackedSpending).mockResolvedValue({
      ...spending,
      categories: [],
    });
    render(await UntrackedSpending());
    expect(
      screen.getByText("Nothing yet this month outside your goals."),
    ).toBeInTheDocument();
  });

  it("leaves the section out when spending is unavailable", async () => {
    vi.mocked(getCurrentUntrackedSpending).mockResolvedValue(undefined);
    const { container } = render(await UntrackedSpending());
    expect(container).toBeEmptyDOMElement();
  });

  it("describes a single purchase with its amount", async () => {
    vi.mocked(getCurrentUntrackedSpending).mockResolvedValue({
      ...spending,
      categories: [{ ...spending.categories[0], transactionCount: 1 }],
    });
    render(await UntrackedSpending());
    expect(screen.getByRole("link")).toHaveAccessibleDescription(
      /^1 transaction R4\s012\.14$/,
    );
  });
});
