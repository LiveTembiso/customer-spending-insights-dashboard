import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { selectOption } from "@/test-utils/select";
import { type ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { goalsQuery } from "@/features/goals/api";
import type { Goal } from "@/features/goals/schemas";
import { makeGoal } from "@/test-utils/fixtures";
import {
  createQueryWrapper,
  createTestQueryClient,
} from "@/test-utils/query-client";
import { normalizedText as text } from "@/test-utils/text";

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

const goal: Goal = makeGoal({
  monthlyBudget: 5500,
  currentSpent: 5318,
  percentageUsed: 96.7,
  daysRemaining: 7,
  status: "warning",
});

function setUrl(search: string) {
  window.history.replaceState(null, "", search ? `?${search}` : "/");
  const params = new URLSearchParams(search);
  vi.mocked(useSearchParams).mockReturnValue(
    params as unknown as ReadonlyURLSearchParams,
  );
  return parseView(params);
}

/** Data left out isn't cached, so the explorer fetches it (stub `fetch` first). */
function renderExplorer(
  search = "",
  data: {
    summary?: SummaryResponse;
    categories?: CategoriesResponse;
    trends?: TrendsResponse;
  } = { summary, categories, trends },
) {
  const { period, months } = setUrl(search);
  const client = createTestQueryClient();
  if (data.summary) {
    client.setQueryData(
      summaryQuery(CUSTOMER, { period }).queryKey,
      data.summary,
    );
  }
  if (data.categories) {
    client.setQueryData(
      categoriesQuery(CUSTOMER, { period }).queryKey,
      data.categories,
    );
  }
  if (data.trends) {
    client.setQueryData(
      trendsQuery(CUSTOMER, { months }).queryKey,
      data.trends,
    );
  }
  client.setQueryData(goalsQuery(CUSTOMER).queryKey, { goals: [goal] });

  const wrapper = createQueryWrapper(client);
  return render(<InsightsExplorer customerId={CUSTOMER} />, { wrapper });
}

const failingFetch = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
  );

beforeEach(() => {
  vi.spyOn(window.history, "pushState");
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
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
    await selectOption("Show", "Transaction count");
    expect(window.history.pushState).toHaveBeenLastCalledWith(
      null,
      "",
      "?period=7d&metric=count",
    );
    // The page hasn't re-rendered with the new URL, and must not lose it.
    await selectOption("Months", "24");
    expect(window.history.pushState).toHaveBeenLastCalledWith(
      null,
      "",
      "?period=7d&months=24&metric=count",
    );
  });

  it("lists only categories with spending and their purchase counts", () => {
    renderExplorer();
    const table = screen.getByRole("table", { name: "Category breakdown" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.map((row) => row.querySelector("th")?.textContent)).toEqual([
      "Groceries",
      "Utilities",
    ]);
    expect(within(table).getAllByRole("columnheader").map(text)).toEqual([
      "Category",
      "Spent",
      "Purchases",
    ]);
    expect(text(rows[1])).toBe("UtilitiesR458.70 (26.8% of spending)3");
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

  it.each([
    { key: "summary", message: "your spending summary", response: summary },
    {
      key: "categories",
      message: "your spending by category",
      response: categories,
    },
    { key: "trends", message: "your monthly spending", response: trends },
  ] as const)(
    "recovers $key after retrying its failed request",
    async ({ key, message, response }) => {
      failingFetch();
      const data: {
        summary?: SummaryResponse;
        categories?: CategoriesResponse;
        trends?: TrendsResponse;
      } = { summary, categories, trends };
      delete data[key];
      renderExplorer("", data);
      const error = `We couldn't load ${message}.`;
      expect(await screen.findByText(error)).toBeVisible();
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify(response)),
      );
      await userEvent.click(screen.getByRole("button", { name: "Try again" }));
      await waitFor(() =>
        expect(screen.queryByText(error)).not.toBeInTheDocument(),
      );
      expect(fetch).toHaveBeenCalledTimes(2);
    },
  );

  it("still points things out when the monthly figures can't load", async () => {
    failingFetch();
    renderExplorer("", { summary, categories });
    expect(
      await screen.findByText("We couldn't load your monthly spending."),
    ).toBeInTheDocument();
    const notes = screen.getByRole("region", { name: "What stands out" });
    expect(
      within(notes).getByRole("heading", {
        name: "Groceries is your biggest category",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Month by month" }),
    ).not.toBeInTheDocument();
  });

  it("says when nothing was spent and there's nothing to compare with", () => {
    renderExplorer("", {
      summary: {
        ...summary,
        totalSpent: 0,
        transactionCount: 0,
        topCategory: null,
        comparedToPrevious: { spentChange: null, transactionChange: 0 },
      },
      categories,
      trends,
    });
    const tiles = screen.getByRole("region", {
      name: "Compared with the previous 30 days",
    });
    expect(text(tiles)).toContain("Nothing to compare with");
    expect(text(tiles)).toContain("Same as the previous 30 days");
    expect(text(tiles)).toContain("No spending yet");
  });

  it("keeps a change in transaction count neutral either way", () => {
    renderExplorer();
    const fewer = screen.getByText(/3\.2% fewer/);
    expect(fewer).toHaveClass("text-muted-strong");
    expect(screen.getByText(/12\.5% more/)).toHaveClass(
      "text-warning-foreground",
    );
  });

  it("tells finished months apart from the current one without an average", () => {
    renderExplorer("", {
      summary,
      categories,
      trends: {
        trends: trends.trends.map((trend, index) =>
          index < 5
            ? {
                ...trend,
                totalSpent: 0,
                transactionCount: 0,
                averageTransaction: 0,
              }
            : trend,
        ),
      },
    });
    const table = screen.getByRole("table", { name: "Month by month" });
    expect(text(table)).toContain("No average to compare with");
  });

  it("says so when there are no months to show", () => {
    renderExplorer("", { summary, categories, trends: { trends: [] } });
    for (const name of ["Monthly spending", "Month by month"]) {
      expect(
        within(screen.getByRole("region", { name })).getByText(
          "No spending yet.",
        ),
      ).toBeInTheDocument();
    }
  });

  it("dims the old figures and drops their dates while a new period loads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );
    const { rerender } = renderExplorer();

    await userEvent.click(screen.getByRole("button", { name: "90 days" }));
    setUrl(window.location.search.slice(1));
    rerender(<InsightsExplorer customerId={CUSTOMER} />);

    expect(
      screen.getByRole("region", {
        name: "Compared with the previous 90 days",
      }),
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText(/of spend$/)).not.toBeInTheDocument();
    const breakdown = screen.getByRole("region", {
      name: "Category breakdown",
    });
    expect(text(breakdown)).toContain("Last 90 days · largest first");
    expect(text(breakdown)).not.toContain("25 Sep");
    expect(
      within(screen.getByRole("region", { name: "What stands out" })).getByRole(
        "list",
      ),
    ).toHaveAttribute("aria-busy", "true");
  });
});
