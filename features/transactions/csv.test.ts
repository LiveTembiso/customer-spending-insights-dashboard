import { describe, expect, it } from "vitest";

import { toCsv } from "./csv";
import type { Transaction } from "./schemas";

const transaction: Transaction = {
  id: "txn_001",
  date: "2026-10-16T22:30:00Z",
  merchant: "Pick n Pay",
  category: "Groceries",
  amount: 245.8,
  description: "Weekly groceries",
  paymentMethod: "Credit Card",
  icon: "shopping-cart",
  categoryColor: "#FF6B6B",
};

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
