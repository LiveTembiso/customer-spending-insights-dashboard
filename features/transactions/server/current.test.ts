import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getFilters } from "@/features/categories/server/repository";
import { getGoals } from "@/features/goals/server/repository";
import { getCategoryBreakdown } from "@/features/spending/server/repository";
import {
  makeCategories,
  makeGoal,
  makeTransaction,
} from "@/test-utils/fixtures";

import { parseFilters } from "../filters";
import {
  getCurrentRecentTransactions,
  getCurrentTransactionsPage,
} from "./current";
import { listTransactions } from "./repository";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: "customer-test" },
}));
vi.mock("@/features/categories/server/repository", () => ({
  getFilters: vi.fn(),
}));
vi.mock("@/features/goals/server/repository", () => ({ getGoals: vi.fn() }));
vi.mock("@/features/spending/server/repository", () => ({
  getCategoryBreakdown: vi.fn(),
}));
vi.mock("./repository", () => ({ listTransactions: vi.fn() }));

const now = new Date("2026-09-30T22:30:00Z");
const page = {
  transactions: [makeTransaction()],
  pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
};
const options = { categories: [], dateRangePresets: [] };
const goals = { goals: [makeGoal()] };
const totals = makeCategories();

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  vi.mocked(listTransactions).mockReturnValue(page);
  vi.mocked(getFilters).mockReturnValue(options);
  vi.mocked(getGoals).mockReturnValue(goals);
  vi.mocked(getCategoryBreakdown).mockReturnValue(totals);
});
afterEach(() => vi.useRealTimers());

describe("current transactions", () => {
  it("assembles custom-range pagination and category totals using the same SAST day", async () => {
    const filters = parseFilters({
      period: "custom",
      from: "2026-09-10",
      to: "2026-09-20",
      category: "Groceries",
      sort: "amount_asc",
      page: "3",
    });
    const result = await getCurrentTransactionsPage(filters);
    expect(result).toMatchObject({
      customerId: "customer-test",
      today: "2026-10-01",
      options,
      goals,
      transactions: { data: page },
      totals: { data: totals },
    });
    expect(listTransactions).toHaveBeenCalledWith(
      "customer-test",
      {
        category: "Groceries",
        startDate: "2026-09-10",
        endDate: "2026-09-20",
        limit: 10,
        offset: 20,
        sortBy: "amount_asc",
        q: undefined,
      },
      now,
    );
    expect(getCategoryBreakdown).toHaveBeenCalledWith(
      "customer-test",
      {
        period: "30d",
        startDate: "2026-09-10",
        endDate: "2026-09-20",
      },
      now,
    );
  });

  it("skips spend totals for merchant searches so they cannot describe unfiltered spend", async () => {
    const result = await getCurrentTransactionsPage(
      parseFilters({ q: "Pick n Pay" }),
    );
    expect(result?.transactions.data).toBe(page);
    expect(result?.transactions.query.q).toBe("Pick n Pay");
    expect(result?.totals).toBeUndefined();
    expect(getCategoryBreakdown).not.toHaveBeenCalled();
  });

  it("allows totals to be unavailable without losing transaction results", async () => {
    vi.mocked(getCategoryBreakdown).mockReturnValue(undefined);
    const result = await getCurrentTransactionsPage(parseFilters({}));
    expect(result?.transactions.data).toBe(page);
    expect(result?.totals).toBeUndefined();
  });

  it.each([listTransactions, getFilters, getGoals])(
    "returns unavailable when a required source is missing (%#)",
    async (source) => {
      vi.mocked(source).mockReturnValueOnce(undefined);
      expect(
        await getCurrentTransactionsPage(parseFilters({})),
      ).toBeUndefined();
      expect(getCategoryBreakdown).not.toHaveBeenCalled();
    },
  );

  it("requests only the latest purchases for the overview", async () => {
    expect(await getCurrentRecentTransactions(5)).toBe(page);
    expect(listTransactions).toHaveBeenCalledWith(
      "customer-test",
      {
        limit: 5,
        offset: 0,
        sortBy: "date_desc",
      },
      now,
    );
  });

  it("rejects a recent-purchase limit that exceeds the API contract", async () => {
    await expect(getCurrentRecentTransactions(101)).rejects.toThrow();
    expect(listTransactions).not.toHaveBeenCalled();
  });
});
