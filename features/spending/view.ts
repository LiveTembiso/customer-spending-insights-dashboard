import { z } from "zod";

import { DEFAULT_PERIOD } from "@/lib/periods";
import { type Period, periodSchema } from "@/lib/schemas";
import { type ParamSource, readSearchParam } from "@/lib/search-params";

export const MONTH_CHOICES = [6, 12, 24] as const;

export type MonthChoice = (typeof MONTH_CHOICES)[number];

export const METRICS = ["total", "count", "average"] as const;

export type Metric = (typeof METRICS)[number];

export const METRIC_LABELS: Record<Metric, string> = {
  total: "Total spent",
  count: "Transaction count",
  average: "Average transaction",
};

export interface InsightsView {
  period: Period;
  months: MonthChoice;
  metric: Metric;
}

export const DEFAULT_VIEW: InsightsView = {
  period: DEFAULT_PERIOD,
  months: 6,
  metric: "total",
};

const monthsSchema = z.coerce
  .number()
  .pipe(z.union(MONTH_CHOICES.map((months) => z.literal(months))));

// Values that don't parse fall back to defaults, so an edited link still opens.
export function parseView(source: ParamSource): InsightsView {
  return {
    period:
      periodSchema.safeParse(readSearchParam(source, "period")).data ??
      DEFAULT_VIEW.period,
    months:
      monthsSchema.safeParse(readSearchParam(source, "months")).data ??
      DEFAULT_VIEW.months,
    metric:
      z.enum(METRICS).safeParse(readSearchParam(source, "metric")).data ??
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
