import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getGoals } from "@/features/goals/server/repository";
import {
  makeCategories,
  makeGoal,
  makeMonthlyTrend,
  makeSummary,
} from "@/test-utils/fixtures";

import { getCurrentInsights } from "./insights";
import { getCategoryBreakdown, getSummary, getTrends } from "./repository";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: "customer-test" },
}));
vi.mock("@/features/goals/server/repository", () => ({ getGoals: vi.fn() }));
vi.mock("./repository", () => ({
  getCategoryBreakdown: vi.fn(),
  getSummary: vi.fn(),
  getTrends: vi.fn(),
}));

const now = new Date("2026-09-30T22:30:00Z");
const view = { period: "90d", months: 12, metric: "count" } as const;
const data = {
  summary: makeSummary({ period: "90d" }),
  categories: makeCategories(),
  trends: { trends: [makeMonthlyTrend()] },
  goals: { goals: [makeGoal()] },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  vi.mocked(getSummary).mockReturnValue(data.summary);
  vi.mocked(getCategoryBreakdown).mockReturnValue(data.categories);
  vi.mocked(getTrends).mockReturnValue(data.trends);
  vi.mocked(getGoals).mockReturnValue(data.goals);
});
afterEach(() => vi.useRealTimers());

describe("getCurrentInsights", () => {
  it("assembles every widget for one customer and one clock reading", async () => {
    expect(await getCurrentInsights(view)).toEqual({
      customerId: "customer-test",
      ...data,
    });
    expect(getSummary).toHaveBeenCalledWith(
      "customer-test",
      { period: "90d" },
      now,
    );
    expect(getCategoryBreakdown).toHaveBeenCalledWith(
      "customer-test",
      { period: "90d" },
      now,
    );
    expect(getTrends).toHaveBeenCalledWith(
      "customer-test",
      { months: 12 },
      now,
    );
    expect(getGoals).toHaveBeenCalledWith("customer-test", now);
  });

  it.each([getSummary, getCategoryBreakdown, getTrends, getGoals])(
    "does not serve a partial dashboard when a required data source is unavailable (%#)",
    async (source) => {
      vi.mocked(source).mockReturnValueOnce(undefined);
      expect(await getCurrentInsights(view)).toBeUndefined();
    },
  );

  it("keeps valid empty data distinct from an unavailable customer", async () => {
    vi.mocked(getCategoryBreakdown).mockReturnValue(
      makeCategories({ categories: [], totalAmount: 0 }),
    );
    vi.mocked(getTrends).mockReturnValue({ trends: [] });
    vi.mocked(getGoals).mockReturnValue({ goals: [] });
    expect(await getCurrentInsights(view)).toMatchObject({
      categories: { categories: [], totalAmount: 0 },
      trends: { trends: [] },
      goals: { goals: [] },
    });
  });
});
