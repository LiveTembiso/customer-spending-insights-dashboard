import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CATEGORIES } from "@/features/categories/catalogue";
import {
  createQueryWrapper,
  createTestQueryClient,
} from "@/test-utils/query-client";
import { makeTransaction } from "@/test-utils/fixtures";
import { DEFAULT_FILTERS } from "../filters";
import { getCurrentTransactionsPage } from "../server/current";
import {
  TransactionsPage,
  TransactionsPageSkeleton,
} from "./transactions-page";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
}));
vi.mock("../server/current", () => ({ getCurrentTransactionsPage: vi.fn() }));
vi.mock("./transactions-explorer", () => ({
  TransactionsExplorer: ({
    customerId,
    today,
  }: {
    customerId: string;
    today: string;
  }) => (
    <h1>
      {customerId} · {today}
    </h1>
  ),
}));

const page = {
  customerId: "12345",
  today: "2026-10-20",
  transactions: {
    query: { limit: 10, offset: 0, sortBy: "date_desc" as const, q: undefined },
    data: {
      transactions: [makeTransaction()],
      pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
    },
  },
  totals: {
    query: { period: "30d" as const },
    data: {
      dateRange: { startDate: "2026-09-21", endDate: "2026-10-20" },
      totalAmount: 245.8,
      categories: [],
    },
  },
  options: {
    categories: [...CATEGORIES],
    dateRangePresets: [{ value: "30d" as const, label: "Last 30 days" }],
  },
  goals: { goals: [] },
};

function CacheProbe() {
  const client = useQueryClient();
  return (
    <output>
      {JSON.stringify(
        client
          .getQueryCache()
          .getAll()
          .map((query) => query.state.data),
      )}
    </output>
  );
}

describe("TransactionsPage", () => {
  it("hydrates the first page, totals and filter options for the browser", async () => {
    vi.mocked(getCurrentTransactionsPage).mockResolvedValue(page);
    const content = await TransactionsPage({
      searchParams: Promise.resolve({}),
    });
    expect(getCurrentTransactionsPage).toHaveBeenLastCalledWith(
      DEFAULT_FILTERS,
    );
    render(
      <>
        {content}
        <CacheProbe />
      </>,
      { wrapper: createQueryWrapper(createTestQueryClient()) },
    );
    expect(screen.getByRole("heading")).toHaveTextContent("12345 · 2026-10-20");
    expect(screen.getByRole("status")).toHaveTextContent("Pick n Pay");
    expect(screen.getByRole("status")).toHaveTextContent("Last 30 days");
  });

  it("hydrates searched results without spend totals", async () => {
    vi.mocked(getCurrentTransactionsPage).mockResolvedValue({
      ...page,
      totals: undefined,
    });
    const content = await TransactionsPage({
      searchParams: Promise.resolve({ q: "pick" }),
    });
    expect(getCurrentTransactionsPage).toHaveBeenLastCalledWith({
      ...DEFAULT_FILTERS,
      q: "pick",
    });
    render(
      <>
        {content}
        <CacheProbe />
      </>,
      { wrapper: createQueryWrapper(createTestQueryClient()) },
    );
    expect(screen.getByRole("status")).toHaveTextContent("Pick n Pay");
    expect(screen.getByRole("status")).not.toHaveTextContent("totalAmount");
  });

  it("returns not found for an unavailable customer", async () => {
    vi.mocked(getCurrentTransactionsPage).mockResolvedValue(undefined);
    await expect(
      TransactionsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("not found");
  });

  it("shows the page heading while results load", () => {
    render(<TransactionsPageSkeleton />);
    expect(screen.getByRole("heading", { name: "Transactions" })).toBeVisible();
    expect(screen.queryByText("Pick n Pay")).not.toBeInTheDocument();
  });
});
