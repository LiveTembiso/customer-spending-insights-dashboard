import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeGoal as goal } from "@/test-utils/fixtures";

import type { Goal } from "../schemas";
import { getCurrentGoalsProgress } from "../server/current";
import { GoalsCard } from "./goals-card";

vi.mock("../server/current", () => ({ getCurrentGoalsProgress: vi.fn() }));

async function renderCard(goals: Goal[]) {
  vi.mocked(getCurrentGoalsProgress).mockResolvedValue({
    goals,
    monthElapsed: 50,
    today: "2026-10-16",
  });
  render(await GoalsCard());
}

describe("GoalsCard", () => {
  it("omits the card when goal data is unavailable", async () => {
    vi.mocked(getCurrentGoalsProgress).mockResolvedValue(undefined);
    const { container } = render(await GoalsCard());
    expect(container).toBeEmptyDOMElement();
  });
  it("shows a goal's status, spend and days left", async () => {
    await renderCard([goal({})]);

    expect(screen.getByText("On track")).toBeInTheDocument();
    expect(
      screen.getByText(/R500\.00 of R1\s000 · 10 days left/),
    ).toBeInTheDocument();
  });

  it("caps the bar of an overspent goal but reports the real figure", async () => {
    await renderCard([
      goal({ currentSpent: 1120, percentageUsed: 112, status: "exceeded" }),
    ]);
    const bar = screen.getByRole("progressbar", {
      name: "Groceries budget used",
    });

    expect(screen.getByText("Over budget")).toBeInTheDocument();
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(bar).toHaveAttribute(
      "aria-valuetext",
      expect.stringContaining("112 percent used"),
    );
  });

  it("uses the singular for the last day", async () => {
    await renderCard([goal({ daysRemaining: 1 })]);
    expect(screen.getByText(/1 day left/)).toBeInTheDocument();
  });

  it("says so when no goals are set", async () => {
    await renderCard([]);
    expect(screen.getByText("No goals set yet.")).toBeInTheDocument();
  });
});
