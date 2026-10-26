import { describe, expect, it } from "vitest";

import { monthYear, purchases, transactions } from "./labels";

describe("spending labels", () => {
  it.each([
    [0, "0 purchases", "0 transactions"],
    [1, "1 purchase", "1 transaction"],
    [2, "2 purchases", "2 transactions"],
  ])("labels a count of %i", (count, purchaseLabel, transactionLabel) => {
    expect(purchases(count)).toBe(purchaseLabel);
    expect(transactions(count)).toBe(transactionLabel);
  });

  it("keeps the year visible when comparing the same month across years", () => {
    expect(monthYear("2025-10")).toBe("Oct 2025");
    expect(monthYear("2026-10")).toBe("Oct 2026");
  });
});
