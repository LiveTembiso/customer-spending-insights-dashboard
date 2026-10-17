import "server-only";

import type { MonthKey } from "@/lib/dates";
import type { Cents } from "@/lib/money";

import type { TransactionRecord } from "./generate";

export function totalCents(records: readonly TransactionRecord[]): Cents {
  return records.reduce((sum, record) => sum + record.amount, 0);
}

export function inMonth(
  records: readonly TransactionRecord[],
  month: MonthKey,
): TransactionRecord[] {
  return records.filter((record) => record.day.startsWith(month));
}

export function groupByMonth(
  records: readonly TransactionRecord[],
): Map<MonthKey, TransactionRecord[]> {
  const groups = new Map<MonthKey, TransactionRecord[]>();
  for (const record of records) {
    const month = record.day.slice(0, 7);
    const group = groups.get(month);
    if (group) group.push(record);
    else groups.set(month, [record]);
  }
  return groups;
}
