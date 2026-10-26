import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeCategories, makeMonthlyTrend } from "@/test-utils/fixtures";

import {
  getCurrentMonthCategories,
  getCurrentMonthToDate,
  getCurrentTrends,
} from "./current";
import { getCategoryBreakdown, getMonthToDate, getTrends } from "./repository";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: "customer-test" },
}));
vi.mock("./repository", () => ({
  getCategoryBreakdown: vi.fn(),
  getMonthToDate: vi.fn(),
  getTrends: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
});
afterEach(() => vi.useRealTimers());

describe("current spending", () => {
  it("starts the category range at the South African month boundary", async () => {
    const now = new Date("2026-09-30T22:30:00Z");
    vi.setSystemTime(now);
    const breakdown = makeCategories();
    vi.mocked(getCategoryBreakdown).mockReturnValue(breakdown);

    expect(await getCurrentMonthCategories()).toBe(breakdown);
    expect(getCategoryBreakdown).toHaveBeenCalledWith(
      "customer-test",
      {
        period: "30d",
        startDate: "2026-10-01",
        endDate: "2026-10-01",
      },
      now,
    );
  });

  it("reads month-to-date spending for the configured customer at the request time", async () => {
    const now = new Date("2026-10-20T12:00:00Z");
    vi.setSystemTime(now);
    const response = {
      range: { start: "2026-10-01", end: "2026-10-20" },
      previousRange: { start: "2026-09-01", end: "2026-09-20" },
      totalSpent: 100,
      transactionCount: 3,
      comparedToPrevious: { spentChange: 5, transactionChange: 0 },
    };
    vi.mocked(getMonthToDate).mockReturnValue(response);
    expect(await getCurrentMonthToDate()).toBe(response);
    expect(getMonthToDate).toHaveBeenCalledWith("customer-test", now);
  });

  it("adds leap-year month progress to trends without changing their data", async () => {
    const now = new Date("2024-02-28T22:30:00Z");
    vi.setSystemTime(now);
    const trends = { trends: [makeMonthlyTrend({ month: "2024-02" })] };
    vi.mocked(getTrends).mockReturnValue(trends);

    expect(await getCurrentTrends(12)).toEqual({
      ...trends,
      monthProgress: { day: 29, days: 29 },
    });
    expect(getTrends).toHaveBeenCalledWith(
      "customer-test",
      { months: 12 },
      now,
    );
    expect(trends).not.toHaveProperty("monthProgress");
  });

  it("returns unavailable trends without manufacturing month progress", async () => {
    vi.mocked(getTrends).mockReturnValue(undefined);
    expect(await getCurrentTrends(6)).toBeUndefined();
  });
});
