import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Goal } from "../schemas";
import { GoalCard } from "./goal-card";

const goal = (overrides: Partial<Goal>): Goal => ({
  id: "goal_001",
  category: "Groceries",
  monthlyBudget: 5500,
  currentSpent: 4473.12,
  percentageUsed: 81.3,
  daysRemaining: 11,
  status: "warning",
  ...overrides,
});

function renderCard(overrides: Partial<Goal> = {}, monthElapsed = 64.5) {
  return render(
    <GoalCard
      goal={goal(overrides)}
      monthElapsed={monthElapsed}
      today="2026-10-21"
    />,
  );
}

const card = () => screen.getByRole("region");
const text = (element: HTMLElement) => element.textContent?.replace(/\s/g, " ");

describe("GoalCard", () => {
  it("says what's left and what that allows per day, rounded down", () => {
    renderCard();
    expect(text(card())).toContain("R1 026.88 left for 11 days");
    expect(text(card())).toContain("About R93 a day keeps you within it.");
    renderCard({ id: "goal_002", currentSpent: 3192.15, monthlyBudget: 4500 });
    expect(screen.getAllByRole("region")[1]).toHaveTextContent("R118 a day");
  });

  it("shows cents once the daily allowance is small", () => {
    renderCard({ currentSpent: 5496, percentageUsed: 99.9 });
    expect(text(card())).toContain("About R0.36 a day");
  });

  it("shows the status the API gives", () => {
    renderCard();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    renderCard({ id: "goal_002", status: "on_track" });
    expect(screen.getByText("On track")).toBeInTheDocument();
  });

  it("describes the bar and the even-pace marker in words", () => {
    renderCard();
    expect(
      screen.getByRole("img", {
        name: "81 percent of the groceries budget used. Spending evenly, you'd be at 65 percent by today.",
      }),
    ).toBeInTheDocument();
  });

  it("shows an overspend instead of what's left, with the bar full", () => {
    renderCard({
      currentSpent: 5620.4,
      percentageUsed: 102.2,
      status: "exceeded",
    });
    expect(text(card())).toContain("R120.40 over budget");
    expect(text(card())).toContain("Over budget with 11 days still to go.");
    expect(screen.getByText("Over budget")).toBeInTheDocument();
    expect(screen.getByRole("img").firstElementChild).toHaveStyle({
      width: "100%",
    });
  });

  it("says so when a budget is used up exactly", () => {
    renderCard({ currentSpent: 5500, percentageUsed: 100 });
    expect(text(card())).toContain("R0.00 left");
    expect(text(card())).not.toContain("left for");
    expect(
      screen.getByText("You've used all of this budget."),
    ).toBeInTheDocument();
  });

  it("doesn't offer an allowance of less than a cent a day", () => {
    renderCard({ currentSpent: 5499.95, percentageUsed: 100 });
    expect(
      screen.getByText("You've used almost all of this budget."),
    ).toBeInTheDocument();
    expect(text(card())).not.toContain("a day");
  });

  it("handles a goal reported with no days left", () => {
    renderCard({ daysRemaining: 0, currentSpent: 5600, status: "exceeded" });
    expect(
      screen.getByText("You went over this budget this month."),
    ).toBeInTheDocument();
  });

  it("uses the singular on the last day", () => {
    renderCard({ daysRemaining: 1, status: "on_track" });
    expect(text(card())).toContain("left for 1 day");
  });

  it("links to this month's purchases in the category", () => {
    renderCard();
    expect(
      screen.getByRole("link", { name: "See purchases in groceries" }),
    ).toHaveAttribute(
      "href",
      "/transactions?category=Groceries&period=custom&from=2026-10-01&to=2026-10-21",
    );
  });
});
