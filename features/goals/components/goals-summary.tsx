import { CircleCheck, TriangleAlert } from "lucide-react";

import { formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

import { isAheadOfPace } from "../pace";
import type { Goal } from "../schemas";

const names = new Intl.ListFormat("en", { type: "conjunction" });

function attentionNote(goals: readonly Goal[], monthElapsed: number) {
  if (goals.length === 0) return "Every goal is on track";
  const list = names.format(goals.map((goal) => goal.category));
  if (goals.every((goal) => goal.status === "exceeded")) {
    return `${list} over budget`;
  }
  if (goals.length > 1) return `${list} need a look`;
  return isAheadOfPace(goals[0].percentageUsed, monthElapsed)
    ? `${list} is ahead of pace`
    : `${list} is nearly used up`;
}

const tile = "flex min-w-0 flex-col gap-1.5 rounded-[18px] px-5 py-4";
const figure =
  "text-[28px] leading-[1.1] font-extrabold tracking-tight tabular-nums";

export function GoalsSummary({
  goals,
  monthElapsed,
}: {
  goals: readonly Goal[];
  monthElapsed: number;
}) {
  const budgeted = goals.reduce((sum, goal) => sum + goal.monthlyBudget, 0);
  const spent = goals.reduce((sum, goal) => sum + goal.currentSpent, 0);
  const share = Math.round((spent / budgeted) * 100);
  const attention = goals.filter((goal) => goal.status !== "on_track");
  const Icon = attention.length > 0 ? TriangleAlert : CircleCheck;
  const count = `${attention.length} of ${goals.length}`;

  return (
    <section aria-label="This month's goals at a glance">
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3.5 overflow-hidden rounded-[18px] bg-navy px-4.5 py-4 text-navy-foreground lg:hidden">
        <span
          aria-hidden
          className="absolute -top-20 -right-15 size-42.5 rounded-full bg-navy-raised"
        />
        <div className="relative flex flex-col gap-1">
          <span className="text-xs text-navy-muted">Spent against goals</span>
          <span className={cn(figure, "text-2xl")}>{formatRands(spent)}</span>
          <span className="text-xs text-navy-muted tabular-nums">
            of {formatRands(budgeted, { cents: false })} · {share}%
          </span>
        </div>
        <div className="relative flex flex-col gap-1">
          <span className="text-xs text-navy-muted">Need attention</span>
          <span className="text-[17px] font-extrabold">{count}</span>
        </div>
      </div>

      <div className="hidden grid-cols-3 gap-3 lg:grid">
        <div
          className={cn(
            tile,
            "relative overflow-hidden bg-navy text-navy-foreground",
          )}
        >
          <span
            aria-hidden
            className="absolute -top-17.5 -right-12.5 size-37.5 rounded-full bg-navy-raised"
          />
          <span className="relative text-[13px] text-navy-muted">
            Budgeted this month
          </span>
          <span className={cn(figure, "relative")}>
            {formatRands(budgeted, { cents: false })}
          </span>
          <span className="relative text-[13px] text-navy-muted">
            across {goals.length} {goals.length === 1 ? "goal" : "goals"}
          </span>
        </div>
        <div className={cn(tile, "bg-card")}>
          <span className="text-[13px] text-muted-foreground">
            Spent against goals
          </span>
          <span className={figure}>{formatRands(spent)}</span>
          <span className="text-[13px] text-muted-foreground">
            {share}% of your budgets
          </span>
        </div>
        <div className={cn(tile, "bg-card")}>
          <span className="text-[13px] text-muted-foreground">
            Need attention
          </span>
          <span className={cn(figure, "flex items-center gap-2")}>
            <Icon
              aria-hidden
              className={cn(
                "size-6",
                attention.length > 0 ? "text-warning" : "text-success",
              )}
              strokeWidth={2.25}
            />
            {count}
          </span>
          <span className="text-[13px] text-muted-foreground">
            {attentionNote(attention, monthElapsed)}
          </span>
        </div>
      </div>
    </section>
  );
}
