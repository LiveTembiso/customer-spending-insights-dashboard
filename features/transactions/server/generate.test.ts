import { describe, expect, it } from "vitest";

import { transactionSchema } from "../schemas";
import { generateTransactions } from "./generate";
import { toTransaction } from "./repository";

const base = {
  seed: 1,
  customerId: "12345",
  from: "2024-01-01",
  to: "2024-03-31",
};

describe("generateTransactions", () => {
  it("is deterministic for the same seed", () => {
    expect(generateTransactions(base)).toEqual(generateTransactions(base));
  });

  it("changes with the seed", () => {
    expect(generateTransactions(base)).not.toEqual(
      generateTransactions({ ...base, seed: 2 }),
    );
  });

  it("keeps past days unchanged when more history is generated", () => {
    const shorter = generateTransactions(base);
    const longer = generateTransactions({ ...base, to: "2024-06-30" });

    expect(longer.slice(0, shorter.length)).toEqual(shorter);
  });

  it("produces valid, uniquely identified transactions in date order", () => {
    const records = generateTransactions(base);
    const ids = new Set(records.map((record) => record.id));

    expect(records.length).toBeGreaterThan(100);
    expect(ids.size).toBe(records.length);
    for (const [index, record] of records.entries()) {
      expect(transactionSchema.parse(toTransaction(record))).toBeTruthy();
      if (index > 0) {
        expect(record.timestamp).toBeGreaterThanOrEqual(
          records[index - 1].timestamp,
        );
      }
    }
  });

  it("collects each debit order once a month on its day", () => {
    const netflix = generateTransactions(base).filter(
      (record) => record.merchant === "Netflix",
    );

    expect(netflix.map((record) => record.day)).toEqual([
      "2024-01-15",
      "2024-02-15",
      "2024-03-15",
    ]);
    expect(netflix.every((record) => record.amount === 19900)).toBe(true);
  });
});
