import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCurrentTrends } from "../server/current";
import { MonthlyTrendCard } from "./monthly-trend-card";

vi.mock("../server/current", () => ({ getCurrentTrends: vi.fn() }));

const totals = [3890.25, 4150.8, 3750.6, 4200.45, 4250.75, 2100];

async function renderCard(found = true) {
  vi.mocked(getCurrentTrends).mockResolvedValue(
    found
      ? {
          trends: totals.map((totalSpent, index) => ({
            month: `2026-${String(index + 5).padStart(2, "0")}`,
            totalSpent,
            transactionCount: 40,
            averageTransaction: 100,
          })),
          monthProgress: { day: 18, days: 31 },
        }
      : undefined,
  );
  return render(await MonthlyTrendCard());
}

describe("MonthlyTrendCard", () => {
  it("describes six months, with the current one to date", async () => {
    await renderCard();
    const chart = screen.getByRole("img", { name: /^Monthly spending/ });
    const label = chart.getAttribute("aria-label")?.replace(/\s/g, " ");

    expect(label).toBe(
      "Monthly spending, May to October: May R3 890.25, June R4 150.80, July R3 750.60, August R4 200.45, September R4 250.75, October to date R2 100.00 (18 of 31 days)",
    );
  });

  it("stripes only the current month", async () => {
    const { container } = await renderCard();
    const fills = [
      ...container.querySelectorAll(".recharts-bar-rectangle path"),
    ].map((path) => path.getAttribute("fill"));

    expect(fills.slice(0, 5)).toEqual(Array(5).fill("var(--primary)"));
    expect(fills[5]).toMatch(/^url\(#stripes-/);
  });

  it("links through to the insights page", async () => {
    await renderCard();
    expect(
      screen.getByRole("link", { name: "View insights on monthly spending" }),
    ).toHaveAttribute("href", "/insights");
  });

  it("renders nothing for an unknown customer", async () => {
    const { container } = await renderCard(false);
    expect(container).toBeEmptyDOMElement();
  });
});
