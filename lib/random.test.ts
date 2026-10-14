import { describe, expect, it } from "vitest";

import { createRandom } from "./random";

const sample = (seed: string) => {
  const random = createRandom(seed);
  return Array.from({ length: 5 }, () => random.next());
};

describe("createRandom", () => {
  it("repeats the same sequence for the same seed", () => {
    expect(sample("a")).toEqual(sample("a"));
  });

  it("produces a different sequence for a different seed", () => {
    expect(sample("a")).not.toEqual(sample("b"));
  });

  it("keeps integers within the inclusive range", () => {
    const random = createRandom("range");
    const values = Array.from({ length: 1000 }, () => random.int(3, 5));

    expect(new Set(values)).toEqual(new Set([3, 4, 5]));
  });
});
