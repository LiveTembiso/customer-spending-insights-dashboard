import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CATEGORIES } from "@/features/categories/catalogue";
import { DEFAULT_FILTERS, type TransactionFilters } from "../filters";
import { TransactionFiltersPanel } from "./transaction-filters";

const options = {
  categories: [...CATEGORIES],
  dateRangePresets: [
    { value: "7d" as const, label: "Last 7 days" },
    { value: "30d" as const, label: "Last 30 days" },
  ],
};
const today = "2026-10-20";

function setup(filters: TransactionFilters = DEFAULT_FILTERS) {
  const onChange = vi.fn();
  const props = { filters, today, options, onChange, resetCount: 0 };
  return { onChange, props, ...render(<TransactionFiltersPanel {...props} />) };
}

describe("TransactionFiltersPanel", () => {
  it("submits a search immediately and trims it", async () => {
    const { onChange } = setup();
    await userEvent.type(screen.getByRole("searchbox"), " Shell ");
    fireEvent.submit(screen.getByRole("search"));
    expect(onChange).toHaveBeenCalledWith({ q: "Shell" }, { replace: true });
  });

  it("submits an empty search to clear it", () => {
    const { onChange } = setup();
    fireEvent.submit(screen.getByRole("search"));
    expect(onChange).toHaveBeenCalledWith({ q: undefined }, { replace: true });
  });

  it("keeps one period selected and applies custom dates only after confirmation", async () => {
    const { onChange } = setup();
    await userEvent.click(screen.getByRole("button", { name: /Last 30 days/ }));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: /Last 7 days/ }));
    expect(onChange).toHaveBeenLastCalledWith({
      period: "7d",
      range: undefined,
    });
    onChange.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Custom range" }));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Apply range" }));
    expect(onChange).toHaveBeenLastCalledWith({
      period: "custom",
      range: { start: "2026-09-21", end: today },
    });
  }, 15_000);

  it("follows an external search change", () => {
    const { props, rerender } = setup({ ...DEFAULT_FILTERS, q: "Shell" });
    rerender(
      <TransactionFiltersPanel
        {...props}
        filters={{ ...DEFAULT_FILTERS, q: "Checkers" }}
      />,
    );
    expect(screen.getByRole("searchbox")).toHaveValue("Checkers");
  });

  it("uses the current custom dates when reopened after navigation", async () => {
    const { props, rerender } = setup({
      ...DEFAULT_FILTERS,
      period: "custom",
      range: { start: "2026-10-01", end: today },
    });
    rerender(
      <TransactionFiltersPanel
        {...props}
        filters={{
          ...props.filters,
          range: { start: "2026-10-05", end: "2026-10-19" },
        }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Custom range" }));
    expect(
      screen.getByRole("status", { name: "Selected date range" }),
    ).toHaveTextContent("5 Oct 2026 – 19 Oct 2026");
  }, 15_000);

  it("keeps search and sort usable before category options arrive", () => {
    const { props, rerender } = setup();
    rerender(<TransactionFiltersPanel {...props} options={undefined} />);
    expect(screen.getByRole("searchbox")).toBeEnabled();
    expect(screen.getByRole("combobox", { name: "Sort by" })).toBeEnabled();
    expect(
      screen.queryByRole("combobox", { name: "Category" }),
    ).not.toBeInTheDocument();
  });
});
