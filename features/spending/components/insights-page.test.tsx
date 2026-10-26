import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { goalsQuery } from "@/features/goals/api";
import {
  makeCategories,
  makeGoal,
  makeMonthlyTrend,
  makeSummary,
} from "@/test-utils/fixtures";
import {
  createQueryWrapper,
  createTestQueryClient,
} from "@/test-utils/query-client";

import { categoriesQuery, summaryQuery, trendsQuery } from "../api";
import { getCurrentInsights } from "../server/insights";
import { InsightsPage, InsightsPageSkeleton } from "./insights-page";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
}));
vi.mock("../server/insights", () => ({ getCurrentInsights: vi.fn() }));
vi.mock("./insights-explorer", () => ({
  InsightsExplorer: ({ customerId }: { customerId: string }) => (
    <h1>Insights for {customerId}</h1>
  ),
}));

const insights = {
  customerId: "12345",
  summary: makeSummary({ period: "90d" }),
  categories: makeCategories(),
  trends: { trends: [makeMonthlyTrend()] },
  goals: { goals: [makeGoal()] },
};

describe("InsightsPage", () => {
  it("hydrates all four query caches under the requested customer, period and month count", async () => {
    vi.mocked(getCurrentInsights).mockResolvedValue(insights);
    const content = await InsightsPage({
      searchParams: Promise.resolve({
        period: "90d",
        months: "12",
        metric: "count",
      }),
    });
    const client = createTestQueryClient();
    render(content, { wrapper: createQueryWrapper(client) });

    expect(getCurrentInsights).toHaveBeenCalledWith({
      period: "90d",
      months: 12,
      metric: "count",
    });
    expect(screen.getByRole("heading")).toHaveTextContent("Insights for 12345");
    expect(
      client.getQueryData(summaryQuery("12345", { period: "90d" }).queryKey),
    ).toEqual(insights.summary);
    expect(
      client.getQueryData(categoriesQuery("12345", { period: "90d" }).queryKey),
    ).toEqual(insights.categories);
    expect(
      client.getQueryData(trendsQuery("12345", { months: 12 }).queryKey),
    ).toEqual(insights.trends);
    expect(client.getQueryData(goalsQuery("12345").queryKey)).toEqual(
      insights.goals,
    );
    expect(
      client.getQueryData(summaryQuery("12345", { period: "30d" }).queryKey),
    ).toBeUndefined();
  });

  it("returns not found instead of rendering incomplete customer data", async () => {
    vi.mocked(getCurrentInsights).mockResolvedValue(undefined);
    await expect(
      InsightsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("not found");
  });

  it("keeps the heading and loading placeholders visible while data loads", () => {
    const { container } = render(<InsightsPageSkeleton />);
    expect(
      screen.getByRole("heading", { name: "Insights", level: 1 }),
    ).toBeVisible();
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
