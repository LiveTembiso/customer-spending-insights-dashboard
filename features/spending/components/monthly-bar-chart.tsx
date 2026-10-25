"use client";

import { useId, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactRands, formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

import { formatMetric } from "../insights";
import type { Metric } from "../view";

export interface MonthBar {
  month: string;
  /** "Oct", under the bar. */
  label: string;
  /** "October 2026 to date", in the tooltip. */
  title: string;
  value: number;
  /** striped: the month isn't over; solid: stands out; muted: the rest. */
  look: "striped" | "solid" | "muted";
  /** Bold month label and value. */
  strong?: boolean;
}

// Recharts draws nothing on the server, so hold the space until it can.
const subscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

const cellProps = (look: MonthBar["look"], stripes: string) =>
  look === "striped"
    ? { fill: `url(#${stripes})`, stroke: "var(--primary)", strokeWidth: 2 }
    : look === "solid"
      ? { fill: "var(--primary)" }
      : { fill: "var(--bar-muted)", stroke: "var(--bar-muted-edge)" };

const exact = (value: number, metric: Metric) =>
  metric === "count"
    ? `${value} ${value === 1 ? "transaction" : "transactions"}`
    : formatRands(value);

export function BarTooltip({
  bar,
  metric,
}: {
  bar?: MonthBar;
  metric: Metric;
}) {
  if (!bar) return null;
  return (
    <div className="grid min-w-32 gap-0.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <span className="text-muted-foreground">{bar.title}</span>
      <span className="font-bold text-foreground tabular-nums">
        {exact(bar.value, metric)}
      </span>
    </div>
  );
}

interface MonthlyBarChartProps {
  bars: MonthBar[];
  /** Top of the y-axis. */
  top: number;
  metric: Metric;
  /** Describes the chart for screen readers, with every figure. */
  label: string;
  average?: number;
  showValues?: boolean;
  /** Label every nth month, on a phone and from `sm` up, counting back from the latest. */
  labelEvery?: [phone: number, wide: number];
  radius?: number;
  axisWidth?: number;
  className?: string;
}

export function MonthlyBarChart({
  bars,
  top,
  metric,
  label,
  average,
  showValues = false,
  labelEvery = [1, 1],
  radius = 4,
  axisWidth = 48,
  className,
}: MonthlyBarChartProps) {
  const stripes = `stripes-${useId().replace(/:/g, "")}`;
  const hydrated = useHydrated();

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "[&_.recharts-bar-rectangle]:forced-color-adjust-none [&_pattern]:forced-color-adjust-none",
        "forced-colors:[&_.recharts-cartesian-axis-line]:stroke-[CanvasText] forced-colors:[&_.recharts-reference-line_line]:stroke-[CanvasText] forced-colors:[&_text]:fill-[CanvasText] forced-colors:[&_text]:stroke-none",
        className,
      )}
    >
      {!hydrated ? (
        <Skeleton className="size-full rounded-[10px]" />
      ) : (
        <ChartContainer
          config={{}}
          initialDimension={{ width: 600, height: 220 }}
          className="aspect-auto size-full text-xs"
        >
          <BarChart
            data={bars}
            accessibilityLayer={false}
            margin={{ top: showValues ? 22 : 8, right: 12, bottom: 0, left: 0 }}
            barCategoryGap="8%"
          >
            <defs>
              <pattern
                id={stripes}
                width="7"
                height="7"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="7" height="7" fill="var(--card)" />
                <rect width="3" height="7" fill="var(--primary)" />
              </pattern>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--background)" />
            <YAxis
              domain={[0, top]}
              ticks={[0, top / 2, top]}
              tickFormatter={(value: number) =>
                metric === "count"
                  ? String(Math.round(value))
                  : formatCompactRands(value)
              }
              tickLine={false}
              axisLine={false}
              width={axisWidth}
              tick={{ fill: "var(--muted-foreground)" }}
            />
            <XAxis
              dataKey="month"
              interval={0}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={({ x, y, index }) => {
                const bar = bars[index];
                const fromEnd = bars.length - 1 - index;
                return (
                  <text
                    x={x}
                    y={Number(y) + 12}
                    textAnchor="middle"
                    className={cn(
                      fromEnd % labelEvery[0] !== 0 && "max-sm:hidden",
                      fromEnd % labelEvery[1] !== 0 && "sm:hidden",
                    )}
                    fill={
                      bar.strong
                        ? "var(--foreground)"
                        : "var(--muted-foreground)"
                    }
                    fontWeight={bar.strong ? 700 : 400}
                  >
                    {bar.label}
                  </text>
                );
              }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={({ active, payload }) => (
                <BarTooltip
                  bar={active ? (payload?.[0]?.payload as MonthBar) : undefined}
                  metric={metric}
                />
              )}
            />
            <Bar
              dataKey="value"
              radius={[radius, radius, 0, 0]}
              isAnimationActive={false}
            >
              {bars.map((bar) => (
                <Cell key={bar.month} {...cellProps(bar.look, stripes)} />
              ))}
              {showValues && (
                <LabelList
                  dataKey="value"
                  zIndex={500}
                  content={({ x, y, width, index }) => {
                    const bar = bars[Number(index)];
                    return (
                      <text
                        x={Number(x) + Number(width) / 2}
                        y={Number(y) - 7}
                        textAnchor="middle"
                        // A halo in the card colour keeps the value readable over the average line.
                        stroke="var(--card)"
                        strokeWidth={4}
                        paintOrder="stroke"
                        fill={
                          bar.strong
                            ? "var(--foreground)"
                            : "var(--muted-foreground)"
                        }
                        fontWeight={bar.strong ? 800 : 400}
                        className="tabular-nums"
                      >
                        {formatMetric(bar.value, metric)}
                      </text>
                    );
                  }}
                />
              )}
            </Bar>
            {average !== undefined && (
              <ReferenceLine
                y={average}
                stroke="var(--foreground)"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            )}
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
