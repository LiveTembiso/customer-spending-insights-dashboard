import { toDayKey, toTimeOfDay } from "@/lib/dates";

import type { Transaction } from "./schemas";

const HEADER = [
  "Date",
  "Time",
  "Merchant",
  "Category",
  "Description",
  "Payment method",
  "Amount spent (ZAR)",
];

function cell(value: string): string {
  // Spreadsheets run a cell starting with one of these as a formula.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function toCsv(transactions: readonly Transaction[]): string {
  const rows = transactions.map((transaction) => {
    const date = new Date(transaction.date);
    return [
      toDayKey(date),
      toTimeOfDay(date),
      transaction.merchant,
      transaction.category,
      transaction.description,
      transaction.paymentMethod,
      transaction.amount.toFixed(2),
    ];
  });
  return [HEADER, ...rows]
    .map((row) => row.map(cell).join(","))
    .join("\r\n")
    .concat("\r\n");
}
