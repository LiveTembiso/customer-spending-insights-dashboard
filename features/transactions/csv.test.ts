import { describe, expect, it } from "vitest";

import { makeTransaction } from "@/test-utils/fixtures";

import { toCsv } from "./csv";
import type { Transaction } from "./schemas";

const transaction: Transaction = makeTransaction({
  date: "2026-10-16T22:30:00Z",
});

const lines = (csv: string) => csv.trimEnd().split("\r\n");

describe("toCsv", () => {
  it("writes a header and one row per transaction", () => {
    expect(lines(toCsv([transaction]))).toEqual([
      "Date,Time,Merchant,Category,Description,Payment method,Amount spent (ZAR)",
      "2026-10-17,00:30,Pick n Pay,Groceries,Weekly groceries,Credit Card,245.80",
    ]);
  });

  it("quotes commas and quotes", () => {
    const row = lines(
      toCsv([{ ...transaction, description: 'Milk, eggs and "bread"' }]),
    )[1];
    expect(row).toContain('"Milk, eggs and ""bread"""');
  });

  it("stops spreadsheets running text as a formula", () => {
    const row = lines(
      toCsv([{ ...transaction, merchant: "=HYPERLINK(1)" }]),
    )[1];
    expect(row).toContain(",'=HYPERLINK(1),");
  });
});
