import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import InsightsPage, { metadata } from "./page";

const pending = vi.hoisted(() =>
  vi.fn<(props: { searchParams: Promise<Record<string, string>> }) => never>(
    () => {
      throw new Promise<never>(() => {});
    },
  ),
);
vi.mock("@/features/spending/components/insights-page", () => ({
  InsightsPage: pending,
  InsightsPageSkeleton: () => <div role="status">Loading insights</div>,
}));

describe("Insights route", () => {
  it("preserves linked filter parameters and displays the loading shell while the server resolves them", () => {
    const searchParams = Promise.resolve({ period: "90d", months: "12" });
    render(
      <InsightsPage searchParams={searchParams} params={Promise.resolve({})} />,
    );
    expect(pending.mock.calls[0][0].searchParams).toBe(searchParams);
    expect(screen.getByRole("status")).toHaveTextContent("Loading insights");
    expect(metadata.title).toBe("Insights");
  });
});
