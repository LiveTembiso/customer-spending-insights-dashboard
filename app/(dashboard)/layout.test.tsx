import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DashboardLayout from "./layout";

vi.mock("next/navigation", () => ({ usePathname: () => "/transactions" }));

vi.mock("@/features/profile/components/account-summary", () => ({
  AccountSummary: () => <span>Account spending summary</span>,
  AccountAvatar: () => <span>Account menu</span>,
  AccountSummarySkeleton: () => <span>Loading account</span>,
  AccountAvatarSkeleton: () => <span>Loading account menu</span>,
}));
vi.mock("@/features/goals/components/goals-attention-badge", () => ({
  GoalsAttentionBadge: () => <span>3 goals need attention</span>,
}));

describe("DashboardLayout", () => {
  it("keeps navigation, both account controls and goal attention available around the page", () => {
    render(
      <DashboardLayout params={Promise.resolve({})}>
        <h1>Customer transactions</h1>
      </DashboardLayout>,
    );
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { name: "Customer transactions" }),
    );
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main");
    expect(
      screen.getAllByRole("link", { name: /Goals.*3 goals need attention/ })
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Account spending summary")).toBeInTheDocument();
    expect(screen.getByText("Account menu")).toBeInTheDocument();
  });
});
