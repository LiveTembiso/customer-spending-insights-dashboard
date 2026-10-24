import { describe, expect, it } from "vitest";

import { DEFAULT_VIEW, parseView, toSearchParams } from "./view";

describe("parseView", () => {
  it("defaults to 30 days, 6 months and total spent", () => {
    expect(parseView(new URLSearchParams())).toEqual(DEFAULT_VIEW);
  });

  it("reads every setting", () => {
    expect(
      parseView(new URLSearchParams("period=1y&months=24&metric=average")),
    ).toEqual({ period: "1y", months: 24, metric: "average" });
  });

  it("falls back on values it doesn't know", () => {
    expect(
      parseView({ period: "2w", months: "7", metric: ["sum", "count"] }),
    ).toEqual(DEFAULT_VIEW);
  });

  it("takes the first of repeated values", () => {
    expect(parseView({ months: ["12", "24"] }).months).toBe(12);
  });
});

describe("toSearchParams", () => {
  it("leaves defaults out of the URL", () => {
    expect(toSearchParams(DEFAULT_VIEW).toString()).toBe("");
  });

  it("round-trips through parseView", () => {
    const view = { period: "7d", months: 12, metric: "count" } as const;
    expect(parseView(toSearchParams(view))).toEqual(view);
  });
});
