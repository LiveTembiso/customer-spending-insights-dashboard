import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GoalsPage, { metadata } from "./page";

const pending = vi.hoisted(() => () => {
  throw new Promise<never>(() => {});
});
vi.mock("@/features/goals/components/goals-overview", () => ({
  GoalsMonth: pending,
  GoalsOverview: pending,
  GoalsOverviewSkeleton: () => <div role="status">Loading goals</div>,
}));
vi.mock("@/features/goals/components/untracked-spending", () => ({
  UntrackedSpending: pending,
}));

describe("GoalsPage", () => {
  it("keeps the budget introduction visible while independent sections load", () => {
    const { container } = render(<GoalsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Spending goals" }),
    ).toBeVisible();
    expect(screen.getByText("This month's budgets")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Loading goals");
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
    expect(metadata.title).toBe("Goals");
  });
});
