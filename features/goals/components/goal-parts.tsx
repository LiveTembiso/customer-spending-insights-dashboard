import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCategory } from "@/features/categories/catalogue";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

import { goalPace } from "../pace";
import type { Goal } from "../schemas";
import { GOAL_STATUS } from "../status";

export const forDays = (days: number) =>
  days === 1 ? "1 day" : `${days} days`;

// Rounded down so the allowance never promises more than is left; cents
// only once it's small enough for them to matter.
export function allowance(perDay: number) {
  return perDay < 10
    ? formatRands(Math.floor(perDay * 100) / 100)
    : formatRands(Math.floor(perDay), { cents: false });
}

/** What's left (or over), and what that allows per day if anything. */
export function remaining(goal: Goal) {
  const { left, over, perDay } = goalPace(goal);
  if (over > 0) return { amount: formatRands(over), label: "over" };
  return {
    amount: formatRands(left),
    label: "left",
    perDay: perDay === null ? undefined : `about ${allowance(perDay)} a day`,
  };
}

export function GoalIcon({
  goal,
  className,
}: {
  goal: Goal;
  className?: string;
}) {
  const category = getCategory(goal.category);
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-[12px] text-navy shadow-[inset_0_0_0_1px_rgba(14,27,44,0.25)] forced-color-adjust-none",
        className,
      )}
      style={{ backgroundColor: category.color }}
    >
      <CategoryIcon name={category.icon} className="size-[55%]" />
    </span>
  );
}

export function StatusPill({ goal, id }: { goal: Goal; id?: string }) {
  const status = GOAL_STATUS[goal.status];
  const Icon = status.icon;
  return (
    <Badge
      id={id}
      className={cn(
        "inline-flex h-auto shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        status.pill,
      )}
    >
      <Icon aria-hidden className="size-3.5" strokeWidth={2.5} />
      {status.label}
    </Badge>
  );
}

export function PaceBar({
  goal,
  monthElapsed,
  className,
  decorative = false,
  onWarning = false,
}: {
  goal: Goal;
  monthElapsed: number;
  className?: string;
  /** Sits on the orange attention surface rather than white. */
  onWarning?: boolean;
  /** Hidden from screen readers where nearby text already says the same. */
  decorative?: boolean;
}) {
  const status = GOAL_STATUS[goal.status];
  const used = Math.round(goal.percentageUsed);
  const pace = Math.min(Math.round(monthElapsed), 100);

  return (
    <div className={cn("relative h-3", className)}>
      <Progress
        value={Math.min(goal.percentageUsed, 100)}
        aria-hidden={decorative || undefined}
        aria-label={`${goal.category} budget used`}
        aria-valuetext={`${used} percent used. Spending evenly, you'd be at ${pace} percent by today.`}
        className="block h-full forced-color-adjust-none"
        trackClassName={cn("h-full", status.track)}
        indicatorClassName={cn("rounded-full", status.bar)}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-y-[5px] -ml-[1.5px] w-[3px] rounded-[2px] bg-navy",
          onWarning
            ? "shadow-[0_0_0_1.5px_var(--warning-surface)]"
            : "shadow-[0_0_0_1.5px_var(--card)]",
        )}
        style={{ left: `${pace}%` }}
      />
    </div>
  );
}
