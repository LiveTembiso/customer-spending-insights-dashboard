import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { getCategory } from "@/features/categories/catalogue";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { Goal, GoalStatus } from "../schemas";
import { getCurrentGoals } from "../server/current";

const STATUS: Record<
  GoalStatus,
  {
    label: string;
    icon: typeof CircleCheck;
    pill: string;
    bar: string;
    track: string;
  }
> = {
  on_track: {
    label: "On track",
    icon: CircleCheck,
    pill: "bg-success-surface text-success-foreground",
    bar: "bg-success",
    track: "bg-background",
  },
  warning: {
    label: "Warning",
    icon: TriangleAlert,
    pill: "bg-warning-track text-warning-foreground",
    bar: "bg-warning",
    track: "bg-warning-track",
  },
  exceeded: {
    label: "Over budget",
    icon: CircleAlert,
    pill: "bg-warning-track text-warning-foreground",
    bar: "bg-warning",
    track: "bg-warning-track",
  },
};

function daysLeft(days: number) {
  return days === 1 ? "1 day left" : `${days} days left`;
}

function GoalRow({ goal }: { goal: Goal }) {
  const category = getCategory(goal.category);
  const status = STATUS[goal.status];
  const Icon = status.icon;

  return (
    <li className="flex gap-3.5">
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-[12px] text-navy"
        style={{ backgroundColor: category.color }}
      >
        <CategoryIcon name={category.icon} className="size-[22px]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold">{goal.category}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
              status.pill,
            )}
          >
            <Icon aria-hidden className="size-3" strokeWidth={2.5} />
            {status.label}
          </span>
        </div>
        <div
          role="img"
          aria-label={`${Math.round(goal.percentageUsed)} percent of the ${goal.category} budget used`}
          className={cn("h-2 overflow-hidden rounded-full", status.track)}
        >
          <div
            className={cn("h-full rounded-full", status.bar)}
            style={{ width: `${Math.min(goal.percentageUsed, 100)}%` }}
          />
        </div>
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {formatRands(goal.currentSpent)} of {formatRands(goal.monthlyBudget)}{" "}
          · {daysLeft(goal.daysRemaining)}
        </span>
      </div>
    </li>
  );
}

export async function GoalsCard() {
  const response = await getCurrentGoals();
  if (!response) return null;

  return (
    <SectionCard
      id="goals-title"
      title="Spending goals"
      link={{ href: "/goals", label: "View all", context: "spending goals" }}
    >
      {response.goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goals set yet.</p>
      ) : (
        <ul className="flex flex-col gap-[18px]">
          {response.goals.map((goal) => (
            <GoalRow key={goal.id} goal={goal} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
