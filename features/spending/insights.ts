import type { Goal } from "@/features/goals/schemas";
import { formatRands } from "@/lib/format";
import { roundTo } from "@/lib/money";

import type { CategorySpend, MonthlyTrend } from "./schemas";
import type { Metric } from "./view";

export function metricValue(trend: MonthlyTrend, metric: Metric): number {
  if (metric === "count") return trend.transactionCount;
  if (metric === "average") return trend.averageTransaction;
  return trend.totalSpent;
}

export function formatMetric(value: number, metric: Metric): string {
  return metric === "count"
    ? String(Math.round(value))
    : formatRands(value, { cents: false });
}

export interface MonthStats {
  /** Months that have ended; the current one is still running. */
  full: MonthlyTrend[];
  current: MonthlyTrend;
  /** Across the full months, or null when there are none. */
  average: number | null;
  highest?: MonthlyTrend;
}

function average(months: readonly MonthlyTrend[], metric: Metric) {
  if (metric === "average") {
    const count = months.reduce((sum, m) => sum + m.transactionCount, 0);
    const total = months.reduce((sum, m) => sum + m.totalSpent, 0);
    return count === 0 ? 0 : roundTo(total / count, 2);
  }
  const sum = months.reduce((total, m) => total + metricValue(m, metric), 0);
  return roundTo(sum / months.length, 2);
}

/** Trends end with the current month, so it's left out of the average. */
export function monthStats(
  trends: readonly MonthlyTrend[],
  metric: Metric,
): MonthStats {
  const full = trends.slice(0, -1);
  const highest = full.reduce<MonthlyTrend | undefined>(
    (best, month) =>
      metricValue(month, metric) > (best ? metricValue(best, metric) : 0)
        ? month
        : best,
    undefined,
  );
  return {
    full,
    current: trends.at(-1)!,
    average: full.length === 0 ? null : average(full, metric),
    highest,
  };
}

/** Percentage above (or below) the average, or null when there's no average. */
export function vsAverage(value: number, average: number | null) {
  if (!average) return null;
  return roundTo(((value - average) / average) * 100, 1);
}

export type Note =
  | { kind: "top"; category: CategorySpend; goal?: Goal }
  | { kind: "largest"; category: CategorySpend; average: number }
  | {
      kind: "month";
      month: MonthlyTrend;
      average: number;
      months: number;
      change: number;
    };

export function standOut(
  categories: readonly CategorySpend[],
  goals: readonly Goal[],
  trends: readonly MonthlyTrend[],
): Note[] {
  const notes: Note[] = [];
  const spent = categories
    .filter((category) => category.amount > 0)
    .toSorted((a, b) => b.amount - a.amount);

  const [top] = spent;
  if (top) {
    const goal = goals.find((goal) => goal.category === top.name);
    notes.push({ kind: "top", category: top, goal });
  }

  const largest = spent
    .filter((category) => category.transactionCount > 0)
    .map((category) => ({
      category,
      average: roundTo(category.amount / category.transactionCount, 2),
    }))
    .reduce<{ category: CategorySpend; average: number } | undefined>(
      (best, item) => (best && best.average >= item.average ? best : item),
      undefined,
    );
  if (largest && largest.category !== top) {
    notes.push({ kind: "largest", ...largest });
  }

  const { full, average: monthly } = monthStats(trends, "total");
  const latest = full.at(-1);
  const change = latest && vsAverage(latest.totalSpent, monthly);
  if (latest && full.length > 1 && monthly !== null && change != null) {
    notes.push({
      kind: "month",
      month: latest,
      average: monthly,
      months: full.length,
      change,
    });
  }

  return notes;
}
