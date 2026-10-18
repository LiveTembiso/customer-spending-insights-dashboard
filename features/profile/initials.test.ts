import { describe, expect, it } from "vitest";

import { initials } from "./initials";

describe("initials", () => {
  it("takes the first letter of the first two names", () => {
    expect(initials("Lerato Mokoena")).toBe("LM");
    expect(initials("Lerato Ntombi Mokoena")).toBe("LN");
  });

  it("ignores stray whitespace", () => {
    expect(initials("  lerato   mokoena ")).toBe("LM");
  });

  it("copes with a single name", () => {
    expect(initials("Lerato")).toBe("L");
  });
});
