import { describe, expect, it } from "vitest";

import { readSearchParam } from "./search-params";

describe("readSearchParam", () => {
  it("uses the first browser URL value, preserving empty and missing values", () => {
    const params = new URLSearchParams("q=first&q=second&category=");
    expect(readSearchParam(params, "q")).toBe("first");
    expect(readSearchParam(params, "category")).toBe("");
    expect(readSearchParam(params, "period")).toBeUndefined();
  });

  it("reads page params with the same first-value behavior", () => {
    const params = {
      q: ["first", "second"],
      category: "Groceries",
      period: [],
    };
    expect(readSearchParam(params, "q")).toBe("first");
    expect(readSearchParam(params, "category")).toBe("Groceries");
    expect(readSearchParam(params, "period")).toBeUndefined();
    expect(readSearchParam(params, "sort")).toBeUndefined();
  });
});
