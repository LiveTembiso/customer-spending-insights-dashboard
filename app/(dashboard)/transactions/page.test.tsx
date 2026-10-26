import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TransactionsPage, { metadata } from "./page";

const pending = vi.hoisted(() =>
  vi.fn<(props: { searchParams: Promise<Record<string, string>> }) => never>(
    () => {
      throw new Promise<never>(() => {});
    },
  ),
);
vi.mock("@/features/transactions/components/transactions-page", () => ({
  TransactionsPage: pending,
  TransactionsPageSkeleton: () => <div role="status">Loading transactions</div>,
}));

describe("Transactions route", () => {
  it("forwards search and category links while showing a loading shell", () => {
    const searchParams = Promise.resolve({ q: "coffee", category: "Dining" });
    render(
      <TransactionsPage
        searchParams={searchParams}
        params={Promise.resolve({})}
      />,
    );
    expect(pending.mock.calls[0][0].searchParams).toBe(searchParams);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading transactions",
    );
    expect(metadata.title).toBe("Transactions");
  });
});
