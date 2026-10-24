import { TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SectionCard } from "@/components/layout/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { formatMonthLong, formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { Note } from "../insights";

const purchases = (count: number) =>
  count === 1 ? "1 purchase" : `${count} purchases`;

function Tile({
  children,
  className,
  color,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
        color &&
          "text-navy shadow-[inset_0_0_0_1px_rgba(14,27,44,0.25)] forced-color-adjust-none",
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      {children}
    </span>
  );
}

function NoteItem({
  icon,
  title,
  body,
  warning,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  warning?: boolean;
  action?: ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-[14px] p-3.5 sm:rounded-[16px] sm:p-4",
        warning
          ? "border border-warning-border bg-warning-surface"
          : "bg-muted",
      )}
    >
      {icon}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <h3 className={cn("font-bold", warning && "text-warning-foreground")}>
          {title}
        </h3>
        <p
          className={cn(
            "text-sm leading-normal",
            warning ? "text-warning-muted" : "text-muted-strong",
          )}
        >
          {body}
        </p>
        {action}
      </div>
    </li>
  );
}

function render(note: Note) {
  if (note.kind === "top") {
    const { category, goal } = note;
    const warning = goal !== undefined && goal.status !== "on_track";
    const used = goal && `${Math.round(goal.percentageUsed)}%`;
    return (
      <NoteItem
        key="top"
        warning={warning}
        icon={
          warning ? (
            <Tile className="bg-warning-track text-warning-foreground">
              <TriangleAlert className="size-4.5" strokeWidth={2.25} />
            </Tile>
          ) : (
            <Tile color={category.color}>
              <CategoryIcon name={category.icon} className="size-4.5" />
            </Tile>
          )
        }
        title={`${category.name} is your biggest category`}
        body={`${purchases(category.transactionCount)}, ${formatRands(category.amount)}${
          goal ? `, and this month's goal is ${used} used.` : "."
        }`}
        action={
          goal && (
            <Link
              href="/goals"
              className="mt-2 flex min-h-11 items-center rounded-[12px] border-[1.5px] border-navy px-3.5 text-sm font-bold text-navy hover:bg-card"
            >
              Review goal{" "}
              <span className="sr-only">for {category.name.toLowerCase()}</span>
            </Link>
          )
        }
      />
    );
  }

  if (note.kind === "largest") {
    const { category, average } = note;
    return (
      <NoteItem
        key="largest"
        icon={
          <Tile color={category.color}>
            <CategoryIcon name={category.icon} className="size-4.5" />
          </Tile>
        }
        title={`${category.name} costs the most per purchase`}
        body={`${purchases(category.transactionCount)} averaging ${formatRands(average)}, the highest of any category.`}
      />
    );
  }

  const { month, average, months, change } = note;
  const name = formatMonthLong(month.month);
  const steady = Math.abs(change) < 1;
  const Icon = change < 0 ? TrendingDown : TrendingUp;
  return (
    <NoteItem
      key="month"
      icon={
        <Tile className="bg-accent text-primary">
          <Icon className="size-4.5" strokeWidth={2.25} />
        </Tile>
      }
      title={
        steady
          ? `${name} was in line with your average`
          : `${name} was ${Math.round(Math.abs(change))}% ${change > 0 ? "above" : "below"} your average`
      }
      body={`${formatRands(month.totalSpent)} against a ${months}-month average of ${formatRands(average)}.`}
    />
  );
}

interface StandOutCardProps {
  notes?: Note[];
  description: string;
  className?: string;
}

export function StandOutCard({
  notes,
  description,
  className,
}: StandOutCardProps) {
  return (
    <SectionCard
      id="stand-out-title"
      title="What stands out"
      description={description}
      className={className}
    >
      {!notes ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing to point out yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5 sm:gap-3">{notes.map(render)}</ul>
      )}
    </SectionCard>
  );
}
