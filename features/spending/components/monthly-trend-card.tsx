import { SectionCard } from "@/components/layout/section-card";
import { formatMonthLong, formatMonthShort, formatRands } from "@/lib/format";

import { axisMax } from "../charts";
import { getCurrentTrends } from "../server/current";
import { type MonthBar, MonthlyBarChart } from "./monthly-bar-chart";

const MONTHS = 6;

export async function MonthlyTrendCard() {
  const response = await getCurrentTrends(MONTHS);
  if (!response) return null;

  const { trends, monthProgress } = response;
  const top = axisMax(Math.max(...trends.map((trend) => trend.totalSpent)));
  const progress = `${monthProgress.day} of ${monthProgress.days} days`;
  const first = trends[0];
  const last = trends.at(-1)!;
  const bars: MonthBar[] = trends.map((trend, index) => {
    const current = index === trends.length - 1;
    const name = `${formatMonthLong(trend.month)} ${trend.month.slice(0, 4)}`;
    return {
      month: trend.month,
      label: formatMonthShort(trend.month),
      title: current ? `${name} to date` : name,
      value: trend.totalSpent,
      look: current ? "striped" : "solid",
      strong: current,
    };
  });
  const summary = trends
    .map((trend, index) =>
      index === trends.length - 1
        ? `${formatMonthLong(trend.month)} to date ${formatRands(trend.totalSpent)} (${progress})`
        : `${formatMonthLong(trend.month)} ${formatRands(trend.totalSpent)}`,
    )
    .join(", ");

  return (
    <SectionCard
      id="trend-title"
      title="Monthly spending"
      link={{
        href: "/insights",
        label: "View insights",
        context: "on monthly spending",
      }}
    >
      <MonthlyBarChart
        bars={bars}
        top={top}
        metric="total"
        label={`Monthly spending, ${formatMonthLong(first.month)} to ${formatMonthLong(last.month)}: ${summary}`}
        className="min-h-52 w-full flex-1"
      />
    </SectionCard>
  );
}
