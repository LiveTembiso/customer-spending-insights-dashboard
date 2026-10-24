import { z } from "zod";

import { type Period, periodSchema } from "@/lib/schemas";

export const MONTH_CHOICES = [6, 12, 24] as const;

export type MonthChoice = (typeof MONTH_CHOICES)[number];

export const METRICS = ["total", "count", "average"] as const;

export type Metric = (typeof METRICS)[number];

export const METRIC_LABELS: Record<Metric, string> = {
  total: "Total spent",
  count: "Transaction count",
  average: "Average transaction",
};

export const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  "1y": "1 year",
};

export interface InsightsView {
  period: Period;
  months: MonthChoice;
  metric: Metric;
}

export const DEFAULT_VIEW: InsightsView = {
  period: "30d",
  months: 6,
  metric: "total",
};

type ParamSource =
  URLSearchParams | Record<string, string | string[] | undefined>;

function read(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

const monthsSchema = z.coerce
  .number()
  .pipe(z.union(MONTH_CHOICES.map((months) => z.literal(months))));

// Values that don't parse fall back to defaults, so an edited link still opens.
export function parseView(source: ParamSource): InsightsView {
  return {
    period:
      periodSchema.safeParse(read(source, "period")).data ??
      DEFAULT_VIEW.period,
    months:
      monthsSchema.safeParse(read(source, "months")).data ??
      DEFAULT_VIEW.months,
    metric:
      z.enum(METRICS).safeParse(read(source, "metric")).data ??
      DEFAULT_VIEW.metric,
  };
}

export function toSearchParams(view: InsightsView): URLSearchParams {
  const params = new URLSearchParams();
  if (view.period !== DEFAULT_VIEW.period) params.set("period", view.period);
  if (view.months !== DEFAULT_VIEW.months) {
    params.set("months", String(view.months));
  }
  if (view.metric !== DEFAULT_VIEW.metric) params.set("metric", view.metric);
  return params;
}
