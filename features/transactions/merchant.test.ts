import { describe, expect, it } from "vitest";

import { merchantInitials } from "./merchant";

describe("merchantInitials", () => {
  it.each(["", "   ", "\t\n"])(
    "returns no initials for a blank merchant (%j)",
    (merchant) => {
      expect(merchantInitials(merchant)).toBe("");
    },
  );

  it("takes the first and last word of a longer name", () => {
    expect(merchantInitials("Pick n Pay")).toBe("PP");
  });

  it("takes two letters of a one-word name", () => {
    expect(merchantInitials("Uber")).toBe("UB");
  });

  it("copes with stray spaces", () => {
    expect(merchantInitials("  Woolworths   Food ")).toBe("WF");
  });
});
