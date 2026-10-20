import { describe, expect, it } from "vitest";

import { axisMax, donutGradient } from "./charts";

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

describe("donutGradient", () => {
  it("splits the ring by amount with a white gap after each slice", () => {
    expect(
      donutGradient([
        { color: "#FF6B6B", amount: 75 },
        { color: "#4ECDC4", amount: 25 },
      ]),
    ).toBe(
      "conic-gradient(#FF6B6B 0% 74.6%, #ffffff 74.6% 75%, #4ECDC4 75% 99.6%, #ffffff 99.6% 100%)",
    );
  });

  it("leaves out categories with no spending", () => {
    expect(
      donutGradient([
        { color: "#FF6B6B", amount: 10 },
        { color: "#4ECDC4", amount: 0 },
      ]),
    ).not.toContain("#4ECDC4");
  });

  it("shows an empty ring when nothing was spent", () => {
    expect(donutGradient([{ color: "#FF6B6B", amount: 0 }])).toBe(
      "conic-gradient(var(--muted) 0 100%)",
    );
  });
});
