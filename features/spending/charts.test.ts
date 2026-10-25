import { describe, expect, it } from "vitest";

import { axisMax } from "./charts";

describe("axisMax", () => {
  it("rounds up to a readable step", () => {
    expect(axisMax(4151)).toBe(5000);
    expect(axisMax(2140)).toBe(2500);
    expect(axisMax(820)).toBe(1000);
    expect(axisMax(21_000)).toBe(25_000);
    expect(axisMax(29_000)).toBe(30_000);
  });

  it("keeps an exact step", () => {
    expect(axisMax(5000)).toBe(5000);
  });

  it("still draws an axis with no spending", () => {
    expect(axisMax(0)).toBe(1000);
  });
});
