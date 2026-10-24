import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { goalsQuery } from "@/features/goals/api";
import type { Goal } from "@/features/goals/schemas";

import { categoriesQuery, summaryQuery, trendsQuery } from "../api";
import type {
  CategoriesResponse,
  SummaryResponse,
  TrendsResponse,
} from "../schemas";
import { parseView } from "../view";
import { InsightsExplorer } from "./insights-explorer";

vi.mock("next/navigation", () => ({ useSearchParams: vi.fn() }));

const CUSTOMER = "12345";

const summary: SummaryResponse = {
  period: "30d",
  totalSpent: 4250.75,
  transactionCount: 47,
  averageTransaction: 90.44,
  topCategory: "Groceries",
  comparedToPrevious: { spentChange: 12.5, transactionChange: -3.2 },
};

const categories: CategoriesResponse = {
  dateRange: { startDate: "2026-09-25", endDate: "2026-10-24" },
  totalAmount: 1709,
  categories: [
    {
      name: "Groceries",
      amount: 1250.3,
      percentage: 73.2,
      transactionCount: 15,
      color: "#FF6B6B",
      icon: "shopping-cart",
    },
    {
      name: "Utilities",
      amount: 458.7,
      percentage: 26.8,
      transactionCount: 3,
      color: "#85C1E9",
      icon: "zap",
    },
    {
      name: "Dining",
      amount: 0,
      percentage: 0,
      transactionCount: 0,
      color: "#F7DC6F",
      icon: "utensils",
    },
  ],
};

const totals = [3890.25, 4150.8, 3750.6, 4200.45, 4250.75, 2100];
const trends: TrendsResponse = {
  trends: totals.map((totalSpent, index) => ({
    month: `2026-${String(index + 5).padStart(2, "0")}`,
    totalSpent,
    transactionCount: 40 + index,
    averageTransaction: Math.round((totalSpent / (40 + index)) * 100) / 100,
  })),
};

const goal: Goal = {
  id: "goal_001",
  category: "Groceries",
  monthlyBudget: 5500,
  currentSpent: 5318,
  percentageUsed: 96.7,
  daysRemaining: 7,
  status: "warning",
};

const text = (element: HTMLElement) => element.textContent?.replace(/\s/g, " ");

function renderExplorer(search = "", { failSummary = false } = {}) {
  const params = new URLSearchParams(search);
  vi.mocked(useSearchParams).mockReturnValue(
    params as unknown as ReadonlyURLSearchParams,
  );
  const { period, months } = parseView(params);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  if (!failSummary) {
    client.setQueryData(summaryQuery(CUSTOMER, { period }).queryKey, summary);
  }
  client.setQueryData(
    categoriesQuery(CUSTOMER, { period }).queryKey,
    categories,
  );
  client.setQueryData(trendsQuery(CUSTOMER, { months }).queryKey, trends);
  client.setQueryData(goalsQuery(CUSTOMER).queryKey, { goals: [goal] });

  return render(
    <QueryClientProvider client={client}>
      <InsightsExplorer customerId={CUSTOMER} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.spyOn(window.history, "pushState").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("InsightsExplorer", () => {
  it("compares the period with the one before", () => {
    renderExplorer();
    const tiles = screen.getByRole("region", {
      name: "Compared with the previous 30 days",
    });
    expect(text(tiles)).toContain("R4 250.75");
    expect(text(tiles)).toContain("12.5% more than the previous 30 days");
    expect(text(tiles)).toContain("3.2% fewer than the previous 30 days");
    expect(text(tiles)).toContain("Groceries");
    expect(text(tiles)).toContain("73.2% of spend");
  });

  it("marks the chosen period and changes it in the URL", async () => {
    renderExplorer("period=90d");
    const group = screen.getByRole("group", { name: "Period" });
    expect(
      within(group).getByRole("button", { name: "90 days", pressed: true }),
    ).toBeInTheDocument();

    await userEvent.click(
      within(group).getByRole("button", { name: "1 year" }),
    );
    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      "",
      "?period=1y",
    );
  });

  it("describes the chart in words, leaving the current month out of the average", () => {
    renderExplorer();
    const chart = screen.getByRole("img", { name: /^Total spent by month/ });
    const label = chart.getAttribute("aria-label")?.replace(/\s/g, " ");
    expect(label).toContain("October 2026 to date R2 100");
    expect(label).toContain("Average of full months R4 049.");
    expect(
      screen.getByText(/May 2026 – Oct 2026 · September highest/),
    ).toBeInTheDocument();
  });

  it("keeps the chart settings in the URL", async () => {
    renderExplorer("period=7d");
    await userEvent.selectOptions(screen.getByLabelText("Show"), "count");
    expect(window.history.pushState).toHaveBeenLastCalledWith(
      null,
      "",
      "?period=7d&metric=count",
    );
    await userEvent.selectOptions(screen.getByLabelText("Months"), "24");
    expect(window.history.pushState).toHaveBeenLastCalledWith(
      null,
      "",
      "?period=7d&months=24",
    );
  });

  it("lists only categories with spending, with their averages", () => {
    renderExplorer();
    const table = screen.getByRole("table", { name: "Category breakdown" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.map((row) => row.querySelector("th")?.textContent)).toEqual([
      "Groceries",
      "Utilities",
    ]);
    expect(text(rows[1])).toContain("R152.90");
  });

  it("points out what stands out, with the goal for the top category", () => {
    renderExplorer();
    const notes = screen.getByRole("region", { name: "What stands out" });
    const items = within(notes).getAllByRole("listitem");
    expect(
      items.map((item) => within(item).getByRole("heading").textContent),
    ).toEqual([
      "Groceries is your biggest category",
      "Utilities costs the most per purchase",
      "September was 5% above your average",
    ]);
    expect(text(items[0])).toContain("this month's goal is 97% used");
    expect(
      within(items[0]).getByRole("link", { name: "Review goal for groceries" }),
    ).toHaveAttribute("href", "/goals");
  });

  it("compares each finished month with the average", () => {
    renderExplorer();
    const table = screen.getByRole("table", { name: "Month by month" });
    const [, current, latestFull] = within(table).getAllByRole("row");
    expect(text(current)).toContain("Oct 2026 · to date");
    expect(text(current)).toContain("Month not finished");
    expect(text(latestFull)).toContain("5.0% above average");
  });

  it("offers a retry when the summary can't load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );
    renderExplorer("", { failSummary: true });
    expect(
      await screen.findByText("We couldn't load your spending summary."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});
