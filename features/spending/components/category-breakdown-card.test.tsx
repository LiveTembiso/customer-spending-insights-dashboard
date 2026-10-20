import { render, screen, within } from "@testing-library/react";
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

  it("lists only the categories with spending", async () => {
    await renderCard([
      category("Groceries", 100, 100),
      category("Dining", 0, 0),
    ]);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");

    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("Groceries");
    expect(screen.getByText("1 category")).toBeInTheDocument();
  });

  it("says so when nothing has been spent", async () => {
    await renderCard([category("Groceries", 0, 0)]);

    expect(screen.getByText("No spending yet.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
