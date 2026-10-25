import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { filtersQuery } from "@/features/categories/api";
import { CATEGORIES } from "@/features/categories/catalogue";
import { goalsQuery } from "@/features/goals/api";
import type { Goal } from "@/features/goals/schemas";
import { categoriesQuery } from "@/features/spending/api";
import { makeGoal, makeTransaction } from "@/test-utils/fixtures";
import {
  createQueryWrapper,
  createTestQueryClient,
} from "@/test-utils/query-client";

import { transactionsQuery } from "../api";
import { parseFilters, toTotalsQuery, toTransactionsQuery } from "../filters";
import type { Transaction } from "../schemas";
import { TransactionsExplorer } from "./transactions-explorer";

vi.mock("next/navigation", () => ({ useSearchParams: vi.fn() }));

const CUSTOMER = "12345";
const TODAY = "2026-10-20";

const transaction: Transaction = makeTransaction();

const goal: Goal = makeGoal({
  monthlyBudget: 5500,
  currentSpent: 5318,
  percentageUsed: 96.7,
  daysRemaining: 12,
  status: "warning",
});

let wideScreen = false;

function setUrl(search: string) {
  const params = new URLSearchParams(search);
  vi.mocked(useSearchParams).mockReturnValue(
    params as unknown as ReadonlyURLSearchParams,
  );
  return parseFilters(params);
}

function renderExplorer(
  search: string,
  transactions: Transaction[] | null = [transaction],
  { total = transactions?.length ?? 0, totals = true } = {},
) {
  const filters = setUrl(search);
  const client = createTestQueryClient();

  if (transactions) {
    const query = toTransactionsQuery(filters, TODAY);
    client.setQueryData(transactionsQuery(CUSTOMER, query).queryKey, {
      transactions,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + transactions.length < total,
      },
    });
  }
  if (totals)
    client.setQueryData(
      categoriesQuery(CUSTOMER, toTotalsQuery(filters, TODAY)).queryKey,
      {
        dateRange: { startDate: "2026-09-21", endDate: TODAY },
        totalAmount: 1000,
        categories: [
          {
            name: "Groceries",
            amount: 245.8,
            percentage: 24.6,
            transactionCount: 4,
            color: "#FF6B6B",
            icon: "shopping-cart",
          },
        ],
      },
    );
  client.setQueryData(filtersQuery(CUSTOMER).queryKey, {
    categories: [...CATEGORIES],
    dateRangePresets: [
      { label: "Last 7 days", value: "7d" },
      { label: "Last 30 days", value: "30d" },
    ],
  });
  client.setQueryData(goalsQuery(CUSTOMER).queryKey, { goals: [goal] });

  const tree = () => (
    <TransactionsExplorer customerId={CUSTOMER} today={TODAY} />
  );
  const { rerender } = render(tree(), { wrapper: createQueryWrapper(client) });
  return {
    /** Follows a URL change the way Next does after pushState. */
    navigateTo(next: string) {
      setUrl(next);
      rerender(tree());
    },
  };
}

const totals = () => screen.getByRole("region", { name: /totals/i });

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: wideScreen,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  wideScreen = false;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("TransactionsExplorer", () => {
  it("shows the transactions and what they add up to", () => {
    renderExplorer("");
    expect(screen.getAllByText("Pick n Pay").length).toBeGreaterThan(0);
    expect(within(totals()).getByText("R1 000.00")).toBeInTheDocument();
    expect(
      screen.getByText(/Last 30 days · 21 Sep – 20 Oct 2026/),
    ).toBeVisible();
  });

  it("totals only the chosen category", () => {
    renderExplorer("category=Groceries");
    expect(within(totals()).getByText("R245.80")).toBeInTheDocument();
  });

  it("only counts while searching, since spend totals ignore the search", () => {
    renderExplorer("q=pick");
    expect(within(totals()).queryByText("Spent")).not.toBeInTheDocument();
    expect(within(totals()).getByText("Transactions")).toBeInTheDocument();
  });

  it("puts a chosen category in the URL", async () => {
    const pushState = vi.spyOn(window.history, "pushState");
    renderExplorer("");
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Category" }),
      "Groceries",
    );
    expect(pushState).toHaveBeenCalledWith(null, "", "?category=Groceries");
  });

  it("selects any category and returns to page one", async () => {
    const pushState = vi.spyOn(window.history, "pushState");
    renderExplorer("page=3");
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Category" }),
      "Utilities",
    );
    expect(pushState).toHaveBeenCalledWith(null, "", "?category=Utilities");
  });

  it("clears the category selection while keeping other filters", async () => {
    const pushState = vi.spyOn(window.history, "pushState");
    renderExplorer("category=Groceries&q=pick");
    const category = screen.getByRole("combobox", { name: "Category" });
    expect(category).toHaveValue("Groceries");
    await userEvent.selectOptions(category, "");
    expect(pushState).toHaveBeenCalledWith(null, "", "?q=pick");
  });

  it("goes back to the first page when a filter changes", async () => {
    const pushState = vi.spyOn(window.history, "pushState");
    renderExplorer("page=3");
    await userEvent.selectOptions(
      screen.getByLabelText("Sort by"),
      "Highest amount",
    );
    expect(pushState).toHaveBeenCalledWith(null, "", "?sort=amount_desc");
  });

  it("shows a purchase's details and its share of the goal", async () => {
    renderExplorer("");
    await userEvent.click(
      screen.getAllByRole("button", { name: /Pick n Pay/ })[0],
    );
    const dialog = screen.getByRole("dialog", { name: "Transaction details" });
    expect(within(dialog).getByText("20 Oct 2026, 08:14")).toBeInTheDocument();
    expect(within(dialog).getByText(/Groceries goal · 97% used/)).toBeVisible();
    expect(
      within(dialog).getByText(
        "This purchase is 4.5% of your R5 500 monthly budget.",
      ),
    ).toBeInTheDocument();
  });

  it("leaves the goal out for purchases in an earlier month", async () => {
    renderExplorer("", [{ ...transaction, date: "2026-09-25T10:00:00Z" }]);
    await userEvent.click(
      screen.getAllByRole("button", { name: /Pick n Pay/ })[0],
    );
    expect(screen.queryByText(/Groceries goal/)).not.toBeInTheDocument();
  });

  it("offers to clear filters when nothing matches", () => {
    renderExplorer("category=Dining", []);
    expect(
      screen.getByText("No transactions match these filters."),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Clear filters" }),
    ).toHaveLength(2);
  });

  it("offers a retry when the transactions don't load", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    renderExplorer("", null);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your transactions didn't load.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});

describe("TransactionsExplorer search", () => {
  it("applies the search after a pause, replacing the history entry", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    renderExplorer("");
    await userEvent.type(screen.getByRole("searchbox"), "pick");
    await waitFor(() =>
      expect(replaceState).toHaveBeenCalledWith(null, "", "?q=pick"),
    );
    expect(replaceState).toHaveBeenCalledTimes(1);
  });

  it("keeps typing that lands before its own search reaches the URL", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    const { navigateTo } = renderExplorer("");
    const box = screen.getByRole("searchbox");
    await userEvent.type(box, "woolw");
    await waitFor(() =>
      expect(replaceState).toHaveBeenCalledWith(null, "", "?q=woolw"),
    );
    await userEvent.type(box, "o");
    navigateTo("q=woolw");
    expect(box).toHaveValue("woolwo");
  });

  it("drops a half-typed search when filters are cleared", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    renderExplorer("category=Groceries");
    await userEvent.type(screen.getByRole("searchbox"), "xyz");
    await userEvent.click(
      screen.getAllByRole("button", { name: "Clear filters" })[0],
    );
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(replaceState).not.toHaveBeenCalled();
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });
});

describe("TransactionsExplorer custom range", () => {
  const search = "period=custom&from=2026-09-01&to=2026-09-30";

  it("applies a valid range", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    renderExplorer(search);
    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "2026-09-10" },
    });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "?period=custom&from=2026-09-10&to=2026-09-30",
    );
  });

  it("explains a backwards range and leaves the URL alone", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    renderExplorer(search);
    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "2026-10-05" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose a start date on or before the end date.",
    );
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("ignores the partial years a typed date passes through", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    renderExplorer(search);
    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "0002-09-01" },
    });
    expect(replaceState).not.toHaveBeenCalled();
  });
});

describe("TransactionsExplorer pages", () => {
  it("moves focus to the list when the page changes", async () => {
    renderExplorer("", [transaction], { total: 25 });
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(
      screen.getByRole("heading", { name: "All categories" }),
    ).toHaveFocus();
  });

  it("steps back from a page past the end to the last real one", async () => {
    const pushState = vi.spyOn(window.history, "pushState");
    renderExplorer("page=9", [], { total: 25 });
    expect(screen.getByText("Page 9 of 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Previous/ }));
    expect(pushState).toHaveBeenCalledWith(null, "", "?page=3");
  });
});

describe("TransactionsExplorer details beside the list", () => {
  beforeEach(() => {
    wideScreen = true;
    // jsdom does no layout, so every element looks hidden to the focus code.
    vi.spyOn(HTMLElement.prototype, "offsetParent", "get").mockReturnValue(
      document.body,
    );
  });

  const openDetails = async () => {
    await userEvent.click(
      screen.getAllByRole("button", { name: /Pick n Pay/ })[0],
    );
    return screen.getByRole("complementary", { name: "Transaction details" });
  };

  it("takes focus and gives it back to the row on close", async () => {
    renderExplorer("");
    const details = await openDetails();
    expect(
      within(details).getByRole("heading", { name: "Transaction details" }),
    ).toHaveFocus();
    await userEvent.click(
      within(details).getByRole("button", { name: "Close details" }),
    );
    expect(
      screen.getAllByRole("button", { name: /Pick n Pay/ })[0],
    ).toHaveFocus();
  });

  it("stays closed when Back returns to the earlier results", async () => {
    const { navigateTo } = renderExplorer("");
    await openDetails();
    navigateTo("category=Utilities");
    navigateTo("");
    expect(
      screen.queryByRole("complementary", { name: "Transaction details" }),
    ).not.toBeInTheDocument();
  });

  it("closes when the filters change", async () => {
    const { navigateTo } = renderExplorer("");
    await openDetails();
    navigateTo("category=Utilities");
    expect(
      screen.queryByRole("complementary", { name: "Transaction details" }),
    ).not.toBeInTheDocument();
  });
});

describe("TransactionsExplorer totals", () => {
  it("stops loading when the totals fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    renderExplorer("", [transaction], { totals: false });
    expect(await within(totals()).findAllByText("Not available")).toHaveLength(
      2,
    );
  });
});
