import { describe, expect, it } from "vitest";

import { purchasesHref } from "./links";

describe("purchasesHref", () => {
  it("covers the month so far", () => {
    expect(purchasesHref("Dining", "2026-10-21")).toBe(
      "/transactions?category=Dining&period=custom&from=2026-10-01&to=2026-10-21",
    );
  });

  it("covers a single day on the 1st", () => {
    expect(purchasesHref("Dining", "2026-10-01")).toBe(
      "/transactions?category=Dining&period=custom&from=2026-10-01&to=2026-10-01",
    );
  });

  it("preserves an explicit range across month boundaries", () => {
    expect(
      purchasesHref("Groceries", { start: "2026-09-25", end: "2026-10-24" }),
    ).toBe(
      "/transactions?category=Groceries&period=custom&from=2026-09-25&to=2026-10-24",
    );
  });
});
