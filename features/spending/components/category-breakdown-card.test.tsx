import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CategoriesResponse, CategorySpend } from "../schemas";
import { getCurrentMonthCategories } from "../server/current";
import { CategoryBreakdownCard } from "./category-breakdown-card";

vi.mock("../server/current", () => ({ getCurrentMonthCategories: vi.fn() }));

const category = (
  name: CategorySpend["name"],
  amount: number,
  percentage: number,
): CategorySpend => ({
  name,
  amount,
  percentage,
  transactionCount: amount > 0 ? 3 : 0,
  color: "#FF6B6B",
  icon: "shopping-cart",
});

async function renderCard(categories: CategorySpend[]) {
  const response: CategoriesResponse = {
    dateRange: { startDate: "2026-10-01", endDate: "2026-10-18" },
    totalAmount: categories.reduce((sum, c) => sum + c.amount, 0),
    categories,
  };
  vi.mocked(getCurrentMonthCategories).mockResolvedValue(response);
  render(await CategoryBreakdownCard());
}

describe("CategoryBreakdownCard", () => {
  it("names the period it covers", async () => {
    await renderCard([category("Groceries", 100, 100)]);
    expect(screen.getByText("This month, 1–18 Oct")).toBeInTheDocument();
  });

  it("describes only the categories with spending", async () => {
    await renderCard([
      category("Groceries", 100, 100),
      category("Dining", 0, 0),
    ]);
    const chart = screen.getByRole("img", { name: /^Spending by category/ });

    expect(chart.getAttribute("aria-label")?.replace(/\s/g, " ")).toBe(
      "Spending by category this month: Groceries R100.00 (100.0%). Total R100.00.",
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("1 category")).toBeInTheDocument();
  });

  it("counts the categories in the middle of the donut", async () => {
    await renderCard([
      category("Groceries", 100, 50),
      category("Dining", 100, 50),
    ]);
    expect(screen.getByText("2 categories")).toBeInTheDocument();
  });

  it("says so when nothing has been spent", async () => {
    await renderCard([category("Groceries", 0, 0)]);

    expect(screen.getByText("No spending yet.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
