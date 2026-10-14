import { describe, expect, it } from "vitest";

import { percentChange, roundTo, toRands } from "./money";

describe("money", () => {
  it("converts cents to rands", () => {
    expect(toRands(24580)).toBe(245.8);
  });

  it("rounds to a number of decimals", () => {
    expect(roundTo(90.4449, 2)).toBe(90.44);
    expect(roundTo(12.45, 1)).toBe(12.5);
  });

  it("calculates signed percentage change", () => {
    expect(percentChange(4250.75, 3778.44)).toBe(12.5);
    expect(percentChange(47, 48.55)).toBe(-3.2);
  });

  it("handles a zero previous value", () => {
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(100, 0)).toBe(100);
  });
});
