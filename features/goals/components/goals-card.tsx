import { EmptyState } from "@/components/empty-state";
import { SectionCard } from "@/components/layout/section-card";
import { formatRands } from "@/lib/format";

import type { Goal } from "../schemas";
import { getCurrentGoalsProgress } from "../server/current";
import { forDays, GoalIcon, PaceBar, StatusPill } from "./goal-parts";

function GoalRow({ goal, monthElapsed }: { goal: Goal; monthElapsed: number }) {
  return (
    <li className="flex gap-3.5">
      <GoalIcon goal={goal} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold">{goal.category}</span>
          <StatusPill goal={goal} />
        </div>
        <PaceBar goal={goal} monthElapsed={monthElapsed} className="h-2" />
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {formatRands(goal.currentSpent)} of{" "}
          {formatRands(goal.monthlyBudget, { cents: false })} ·{" "}
          {forDays(goal.daysRemaining)} left
        </span>
      </div>
    </li>
  );
}

export async function GoalsCard() {
  const progress = await getCurrentGoalsProgress();
  if (!progress) return null;

  return (
    <SectionCard
      id="goals-title"
      title="Spending goals"
      link={{ href: "/goals", label: "View all", context: "spending goals" }}
    >
      {progress.goals.length === 0 ? (
        <EmptyState message="No goals set yet." />
      ) : (
        <ul className="flex flex-col gap-4.5">
          {progress.goals.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              monthElapsed={progress.monthElapsed}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
