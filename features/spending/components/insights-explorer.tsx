"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { goalsQuery } from "@/features/goals/api";
import { formatDateRange } from "@/lib/format";
import { navigate } from "@/lib/history";
import { PERIOD_LABELS } from "@/lib/periods";
import { type Period, PERIODS } from "@/lib/schemas";
import { cn, pressedInForcedColors } from "@/lib/utils";

import { categoriesQuery, summaryQuery, trendsQuery } from "../api";
import { standOut } from "../insights";
import { type InsightsView, parseView, toSearchParams } from "../view";
import { CategorySpendCard } from "./category-spend-card";
import { InsightsSummary } from "./insights-summary";
import { MonthTableCard } from "./month-table-card";
import { SpendingChartCard } from "./spending-chart-card";
import { StandOutCard } from "./stand-out-card";

function PeriodControl({
  period,
  onChange,
}: {
  period: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Period"
      className="grid w-full grid-cols-4 gap-1 rounded-[12px] bg-card p-1 sm:flex sm:w-auto"
    >
      {PERIODS.map((value) => {
        const pressed = value === period;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(value)}
            className={cn(
              "min-h-11 rounded-[9px] border border-transparent px-3.5 text-[13px] whitespace-nowrap sm:text-sm",
              pressed
                ? cn(
                    "bg-navy font-bold text-navy-foreground",
                    pressedInForcedColors,
                  )
                : "font-semibold text-muted-strong hover:bg-background",
            )}
          >
            {PERIOD_LABELS[value].short}
          </button>
        );
      })}
    </div>
  );
}

function LoadFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-card p-5"
    >
      <p className="text-sm text-muted-strong">We couldn&apos;t load {what}.</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 rounded-[12px] border-[1.5px] border-navy px-4 text-sm font-bold text-navy hover:bg-background"
      >
        Try again
      </button>
    </div>
  );
}

export function InsightsExplorer({ customerId }: { customerId: string }) {
  const searchParams = useSearchParams();
  const view = useMemo(() => parseView(searchParams), [searchParams]);
  const { period, months, metric } = view;

  const summary = useQuery({
    ...summaryQuery(customerId, { period }),
    placeholderData: keepPreviousData,
  });
  const categories = useQuery({
    ...categoriesQuery(customerId, { period }),
    placeholderData: keepPreviousData,
  });
  const trends = useQuery({
    ...trendsQuery(customerId, { months }),
    placeholderData: keepPreviousData,
  });
  const goals = useQuery(goalsQuery(customerId));

  // Read the URL itself: two quick changes can land before a re-render.
  const update = (change: Partial<InsightsView>) =>
    navigate(
      toSearchParams({
        ...parseView(new URLSearchParams(window.location.search)),
        ...change,
      }),
    );

  const settled = (query: { isSuccess: boolean; isError: boolean }) =>
    query.isSuccess || query.isError;
  const notes =
    categories.data && settled(trends) && settled(goals)
      ? standOut(
          categories.data.categories,
          goals.data?.goals ?? [],
          trends.data?.trends ?? [],
        )
      : undefined;
  const range = categories.isPlaceholderData
    ? undefined
    : categories.data?.dateRange;
  const periodDescription = range
    ? `${PERIOD_LABELS[period].current} · ${formatDateRange(range.startDate, range.endDate)}`
    : PERIOD_LABELS[period].current;

  return (
    <>
      <PageHeader
        eyebrow="How your spending is changing"
        title="Insights"
        actions={
          <PeriodControl
            period={period}
            onChange={(next) => update({ period: next })}
          />
        }
      />
      <div className="flex flex-col gap-4">
        {summary.isError && !summary.data ? (
          <LoadFailed
            what="your spending summary"
            onRetry={() => void summary.refetch()}
          />
        ) : (
          <InsightsSummary
            period={period}
            summary={summary.data}
            categories={
              categories.isPlaceholderData || summary.isPlaceholderData
                ? undefined
                : categories.data
            }
            stale={summary.isPlaceholderData}
          />
        )}

        {trends.isError && !trends.data ? (
          <LoadFailed
            what="your monthly spending"
            onRetry={() => void trends.refetch()}
          />
        ) : (
          <SpendingChartCard
            trends={trends.data?.trends}
            months={months}
            metric={metric}
            onChange={update}
            stale={trends.isPlaceholderData}
          />
        )}

        {categories.isError && !categories.data ? (
          <LoadFailed
            what="your spending by category"
            onRetry={() => void categories.refetch()}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <CategorySpendCard
              description={`${periodDescription} · largest first`}
              breakdown={categories.data}
              stale={categories.isPlaceholderData}
            />
            <StandOutCard
              notes={notes}
              stale={categories.isPlaceholderData || trends.isPlaceholderData}
              description={`Based on the ${PERIOD_LABELS[period].current.toLowerCase()} and your recent months`}
            />
          </div>
        )}

        {!(trends.isError && !trends.data) && (
          <MonthTableCard
            trends={trends.data?.trends}
            stale={trends.isPlaceholderData}
          />
        )}
      </div>
    </>
  );
}
