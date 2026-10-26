import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeCategorySpend } from "@/test-utils/fixtures";
import { normalizedText as text } from "@/test-utils/text";

import type { CategoriesResponse, CategorySpend } from "../schemas";
import { CategorySpendCard } from "./category-spend-card";

const category = (
  name: CategorySpend["name"],
  amount: number,
  transactionCount: number,
  percentage: number,
): CategorySpend =>
  makeCategorySpend({ name, amount, percentage, transactionCount });

const breakdown = (categories: CategorySpend[]): CategoriesResponse => ({
  dateRange: { startDate: "2026-09-25", endDate: "2026-10-24" },
  totalAmount: categories.reduce((sum, c) => sum + c.amount, 0),
  categories,
});

function renderCard(data?: CategoriesResponse, stale = false) {
  return render(
    <CategorySpendCard
      description="Last 30 days"
      breakdown={data}
      stale={stale}
    />,
  );
}

describe("CategorySpendCard", () => {
  it("shows a placeholder while loading", () => {
    const { container } = renderCard();
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
  });

  it("says so when nothing was spent", () => {
    renderCard(breakdown([category("Dining", 0, 0, 0)]));
    expect(screen.getByText("No spending yet.")).toBeInTheDocument();
  });

  it("lists categories largest first, leaving out empty ones", () => {
    renderCard(
      breakdown([
        category("Utilities", 458.7, 1, 26.8),
        category("Dining", 0, 0, 0),
        category("Groceries", 1250.3, 15, 73.2),
      ]),
    );
    const items = within(screen.getByRole("list")).getAllByRole("listitem");

    expect(items.map(text)).toEqual([
      "Groceries15 purchasesR1 250.3073.2%",
      "Utilities1 purchaseR458.7026.8%",
    ]);
  });

  it("gives each category's share to screen readers in the table", () => {
    renderCard(breakdown([category("Groceries", 1250.3, 15, 100)]));
    const table = screen.getByRole("table", { name: "Category breakdown" });
    const [, row] = within(table).getAllByRole("row");

    expect(text(row)).toBe("GroceriesR1 250.30 (100.0% of spending)15");
  });

  it("puts the total in whole rands in the donut", () => {
    renderCard(
      breakdown([
        category("Groceries", 1250.3, 15, 73.2),
        category("Utilities", 458.7, 3, 26.8),
      ]),
    );
    expect(
      screen.getAllByText("2 categories", { exact: false }),
    ).not.toHaveLength(0);
    expect(
      screen.getByText(
        (_, el) => text(el!) === "R1 709" && el!.tagName === "SPAN",
      ),
    ).toBeInTheDocument();
  });

  it("marks old figures as loading", () => {
    const { container } = renderCard(
      breakdown([category("Groceries", 1250.3, 15, 100)]),
      true,
    );
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});
