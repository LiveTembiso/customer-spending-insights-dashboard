import Link from "next/link";

import { purchasesHref } from "@/features/transactions/links";
import type { DayKey } from "@/lib/dates";
import { formatRands } from "@/lib/format";

import { goalPace } from "../pace";
import type { Goal } from "../schemas";
import {
  allowance,
  forDays,
  GoalIcon,
  PaceBar,
  StatusPill,
} from "./goal-parts";

interface GoalCardProps {
  goal: Goal;
  monthElapsed: number;
  today: DayKey;
}

function advice(goal: Goal) {
  const { left, over, perDay } = goalPace(goal);
  if (over > 0) {
    return goal.daysRemaining > 0
      ? `Over budget with ${forDays(goal.daysRemaining)} still to go.`
      : "You went over this budget this month.";
  }
  if (perDay === null) {
    return left > 0
      ? "You've used almost all of this budget."
      : "You've used all of this budget.";
  }
  return (
    <>
      About <b className="font-bold">{allowance(perDay)} a day</b> keeps you
      within it.
    </>
  );
}

/** The goal that most needs attention, across a whole row. */
export function GoalCard({ goal, monthElapsed, today }: GoalCardProps) {
  const { left, over } = goalPace(goal);
  const used = Math.round(goal.percentageUsed);
  const titleId = `goal-${goal.id}`;

  return (
    <section
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col gap-4 rounded-[18px] border border-warning-border bg-warning-surface p-[18px] md:rounded-[22px] md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <GoalIcon goal={goal} />
          <h2 id={titleId} className="text-lg font-extrabold">
            {goal.category}
          </h2>
        </div>
        <StatusPill goal={goal} />
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[30px] font-extrabold tracking-tight tabular-nums md:text-4xl">
            {formatRands(over > 0 ? over : left)}
          </span>{" "}
          <span className="text-sm text-warning-muted">
            {over > 0
              ? "over budget"
              : left > 0 && goal.daysRemaining > 0
                ? `left for ${forDays(goal.daysRemaining)}`
                : "left"}
          </span>
        </p>
        <PaceBar
          goal={goal}
          monthElapsed={monthElapsed}
          className="h-3.5"
          onWarning
        />
        <p className="text-[13px] text-warning-muted tabular-nums">
          <b className="font-bold text-foreground">
            {formatRands(goal.currentSpent)}
          </b>{" "}
          of {formatRands(goal.monthlyBudget, { cents: false })} · {used}% used
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-warning-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-[1.55] text-warning-muted">
          {advice(goal)}
        </p>
        <Link
          href={purchasesHref(goal.category, today)}
          className="flex min-h-11 shrink-0 items-center self-start rounded-[12px] border-[1.5px] border-navy px-4 text-sm font-bold text-foreground hover:bg-navy/5 sm:self-auto"
        >
          See purchases{" "}
          <span className="sr-only">in {goal.category.toLowerCase()}</span>
        </Link>
      </div>
    </section>
  );
}
