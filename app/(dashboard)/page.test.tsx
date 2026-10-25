import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import OverviewPage from "./page";

const loading = vi.hoisted(() => () => {
  throw new Promise<never>(() => {});
});

// Exercise the page's loading shell without needing a live server request.
vi.mock("@/features/goals/components/goals-card", () => ({
  GoalsCard: loading,
}));
vi.mock("@/features/spending/components/category-breakdown-card", () => ({
  CategoryBreakdownCard: loading,
}));
vi.mock("@/features/spending/components/monthly-trend-card", () => ({
  MonthlyTrendCard: loading,
}));
vi.mock("@/features/transactions/components/recent-transactions-card", () => ({
  RecentTransactionsCard: loading,
}));
vi.mock(
  "@/features/spending/components/month-spend-card",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/spending/components/month-spend-card")
    >()),
    MonthSpendCard: loading,
  }),
);

describe("OverviewPage", () => {
  it("keeps the introduction visible while spending widgets are loading", () => {
    const { container } = render(<OverviewPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Understand yourspending",
    );
    expect(
      screen.getByText(/See where your money goes, spot trends/),
    ).toBeVisible();
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
  });
});
