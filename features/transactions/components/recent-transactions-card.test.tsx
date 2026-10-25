import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeTransaction } from "@/test-utils/fixtures";

import type { Transaction } from "../schemas";
import { getCurrentRecentTransactions } from "../server/current";
import { RecentTransactionsCard } from "./recent-transactions-card";

vi.mock("../server/current", () => ({
  getCurrentRecentTransactions: vi.fn(),
}));

const transaction: Transaction = makeTransaction({
  date: "2026-10-16T22:30:00Z",
});

async function renderCard(transactions: Transaction[]) {
  vi.mocked(getCurrentRecentTransactions).mockResolvedValue({
    transactions,
    pagination: {
      total: transactions.length,
      limit: 5,
      offset: 0,
      hasMore: false,
    },
  });
  render(await RecentTransactionsCard());
}

describe("RecentTransactionsCard", () => {
  it("dates a late-evening purchase by its South African day", async () => {
    await renderCard([transaction]);
    expect(screen.getAllByText(/17 Oct 2026/).length).toBeGreaterThan(0);
  });

  it("shows amounts as debits with a minus sign", async () => {
    await renderCard([transaction]);
    expect(screen.getAllByText("−R245.80").length).toBeGreaterThan(0);
  });

  it("labels the table by the section heading", async () => {
    await renderCard([transaction]);
    expect(
      screen.getByRole("table", { name: "Recent transactions" }),
    ).toBeInTheDocument();
  });

  it("says so when there are no transactions", async () => {
    await renderCard([]);
    expect(screen.getByText("No transactions yet.")).toBeInTheDocument();
  });

  it("leaves the card out when the customer is unavailable", async () => {
    vi.mocked(getCurrentRecentTransactions).mockResolvedValue(undefined);
    const { container } = render(await RecentTransactionsCard());
    expect(container).toBeEmptyDOMElement();
  });
});
