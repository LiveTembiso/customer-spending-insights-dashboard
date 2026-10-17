import "server-only";

import { CATEGORIES } from "@/features/categories/catalogue";
import type { TransactionRecord } from "@/features/transactions/server/generate";
import {
  groupByMonth,
  totalCents,
} from "@/features/transactions/server/records";
import { getCustomerTransactions } from "@/features/transactions/server/store";
import { addMonths, toMonthKey } from "@/lib/dates";
import { percentChange, roundTo, toRands } from "@/lib/money";

import type {
  CategoriesQuery,
  CategoriesResponse,
  SummaryQuery,
  SummaryResponse,
  TrendsQuery,
  TrendsResponse,
} from "../schemas";
import {
  type DayRange,
  isInRange,
  periodRange,
  previousPeriodCutoff,
  previousPeriodRange,
} from "./periods";

function average(records: readonly TransactionRecord[]) {
  return records.length === 0
    ? 0
    : roundTo(toRands(totalCents(records)) / records.length, 2);
}

function inRange(records: readonly TransactionRecord[], range: DayRange) {
  return records.filter((record) => isInRange(record.day, range));
}

function spendByCategory(records: readonly TransactionRecord[]) {
  return CATEGORIES.map((category) => {
    const matching = records.filter((r) => r.category === category.name);
    return { category, amount: totalCents(matching), count: matching.length };
  }).sort((a, b) => b.amount - a.amount);
}

export function getSummary(
  customerId: string,
  { period }: SummaryQuery,
  now: Date,
): SummaryResponse | undefined {
  const records = getCustomerTransactions(customerId, now);
  if (!records) return undefined;

  const current = inRange(records, periodRange(period, now));
  const cutoff = previousPeriodCutoff(period, now);
  const previous = inRange(records, previousPeriodRange(period, now)).filter(
    (record) => record.timestamp <= cutoff,
  );
  const [top] = spendByCategory(current);

  return {
    period,
    totalSpent: toRands(totalCents(current)),
    transactionCount: current.length,
    averageTransaction: average(current),
    topCategory: top.amount > 0 ? top.category.name : null,
    comparedToPrevious: {
      spentChange: percentChange(totalCents(current), totalCents(previous)),
      transactionChange: percentChange(current.length, previous.length),
    },
  };
}

export function getCategoryBreakdown(
  customerId: string,
  query: CategoriesQuery,
  now: Date,
): CategoriesResponse | undefined {
  const records = getCustomerTransactions(customerId, now);
  if (!records) return undefined;

  const range: DayRange =
    query.startDate && query.endDate
      ? { start: query.startDate, end: query.endDate }
      : periodRange(query.period, now);
  const matching = inRange(records, range);
  const totalAmount = totalCents(matching);

  return {
    dateRange: { startDate: range.start, endDate: range.end },
    totalAmount: toRands(totalAmount),
    categories: spendByCategory(matching).map(
      ({ category, amount, count }) => ({
        name: category.name,
        amount: toRands(amount),
        percentage:
          totalAmount === 0 ? 0 : roundTo((amount / totalAmount) * 100, 1),
        transactionCount: count,
        color: category.color,
        icon: category.icon,
      }),
    ),
  };
}

export function getTrends(
  customerId: string,
  { months }: TrendsQuery,
  now: Date,
): TrendsResponse | undefined {
  const records = getCustomerTransactions(customerId, now);
  if (!records) return undefined;

  const byMonth = groupByMonth(records);
  const currentMonth = toMonthKey(now);

  return {
    trends: Array.from({ length: months }, (_, index) => {
      const month = addMonths(currentMonth, index - months + 1);
      const matching = byMonth.get(month) ?? [];
      return {
        month,
        totalSpent: toRands(totalCents(matching)),
        transactionCount: matching.length,
        averageTransaction: average(matching),
      };
    }),
  };
}
