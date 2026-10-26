"use client";

import {
  memo,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Cell, Pie, PieChart } from "recharts";

import { ChartContainer } from "@/components/ui/chart";
import { CategoryDot } from "@/features/categories/components/category-dot";
import { formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

// Characters average about 0.53em wide; the amount keeps within 80% of the hole.
const FIT = 80 / 0.53;

/** Font size for text in the hole: 18px, smaller as it gets longer. */
export const holeFontSize = (text: string) =>
  `min(18px, ${(FIT / text.length).toFixed(1)}cqi)`;

/** The total in the hole, in whole rands, shrinking as it grows so it never reaches the ring. */
export function DonutTotal({
  amount,
  caption,
  className,
}: {
  amount: number;
  caption: string;
  className?: string;
}) {
  const text = formatRands(amount, { cents: false });
  return (
    <span className={cn("flex flex-col items-center gap-0.5", className)}>
      <span
        className="leading-tight font-extrabold tabular-nums"
        style={{ fontSize: holeFontSize(text) }}
      >
        {text}
      </span>
      <span className="text-xs text-muted-foreground">{caption}</span>
    </span>
  );
}

interface Slice {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

const DonutRing = memo(function DonutRing({
  slices,
  size,
  active,
  onHover,
}: {
  slices: readonly Slice[];
  size: number;
  active?: string;
  onHover: (name: string) => void;
}) {
  const data = useMemo(
    () => slices.map((slice) => ({ ...slice, fill: slice.color })),
    [slices],
  );

  return (
    <ChartContainer
      config={{}}
      initialDimension={{ width: size, height: size }}
      className="aspect-square size-full"
    >
      <PieChart
        accessibilityLayer={false}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          innerRadius="66%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          paddingAngle={slices.length > 1 ? 3 : 0}
          cornerRadius={6}
          stroke="none"
          isAnimationActive={false}
          rootTabIndex={-1}
          onMouseEnter={(_, index) => onHover(slices[index].name)}
        >
          {data.map((slice) => (
            <Cell
              key={slice.name}
              fillOpacity={
                active === undefined || active === slice.name ? 1 : 0.35
              }
              className="transition-[fill-opacity] duration-200 motion-reduce:transition-none"
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
});

export function CategoryDonut({
  slices,
  size,
  label,
  className,
  children,
}: {
  slices: readonly Slice[];
  /** Pixel size for the first render, before the chart can measure itself. */
  size: number;
  /** What the chart shows, for screen readers; leave out when the figures are listed beside it. */
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState<string>();
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const shown = slices.find((slice) => slice.name === active);
  const hover = useCallback((name: string) => {
    setPointer(lastPointer.current);
    setActive(name);
  }, []);

  return (
    <div
      ref={root}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "relative shrink-0 rounded-full [&_svg]:forced-color-adjust-none",
        className,
      )}
      // Pointer events preserve fractional coordinates at the inner edge.
      onPointerMove={(event) => {
        const box = root.current?.getBoundingClientRect();
        if (!box) return;
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        lastPointer.current = { x, y };
        if (!shown) return;
        const radius = box.width / 2;
        const fromCentre = Math.hypot(x - radius, y - radius) / radius;
        if (fromCentre < 0.66 || fromCentre > 1) setActive(undefined);
        else setPointer({ x, y });
      }}
      onMouseLeave={() => setActive(undefined)}
    >
      <DonutRing
        slices={slices}
        size={size}
        active={shown?.name}
        onHover={hover}
      />
      <span className="@container pointer-events-none absolute inset-[17%] flex flex-col items-center justify-center gap-0.5 rounded-full">
        {children}
      </span>
      {shown && (
        <span
          role="tooltip"
          className="pointer-events-none absolute z-10 flex min-w-36 items-center gap-2 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl"
          style={{
            left: pointer.x + 12,
            top: pointer.y + 12,
          }}
        >
          <CategoryDot color={shown.color} />
          <span className="flex-1 text-muted-foreground">{shown.name}</span>
          <span className="font-bold text-foreground tabular-nums">
            {formatRands(shown.amount)}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {shown.percentage.toFixed(1)}%
          </span>
        </span>
      )}
    </div>
  );
}
