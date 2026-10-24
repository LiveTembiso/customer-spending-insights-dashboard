import { SectionCardSkeleton } from "@/components/layout/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonthLong } from "@/lib/format";

import { getCurrentGoalsProgress } from "../server/current";
import { GoalCard } from "./goal-card";
import { forDays } from "./goal-parts";
import { GoalList } from "./goal-list";
import { GoalsSummary } from "./goals-summary";

/** "October · 11 days left", for the page header. */
export async function GoalsMonth() {
  const progress = await getCurrentGoalsProgress();
  if (!progress) return null;
  const month = formatMonthLong(progress.today.slice(0, 7));
  const days = progress.goals[0]?.daysRemaining;
  if (days === undefined) return month;
  return `${month} · ${forDays(days)} left`;
}

export async function GoalsOverview() {
  const progress = await getCurrentGoalsProgress();
  if (!progress) return null;
  const { goals, monthElapsed, today } = progress;

  if (goals.length === 0) {
    return (
      <section className="flex flex-col gap-1 rounded-[22px] bg-card p-6">
        <h2 className="text-lg font-bold">No goals set yet</h2>
        <p className="text-sm text-muted-foreground">
          Your spending this month is below, by category.
        </p>
      </section>
    );
  }

  // Goals arrive most urgent first, so only the first can need a card of its own.
  const [first, ...others] = goals;
  const featured = first.status !== "on_track" ? first : undefined;
  const listed = featured ? others : goals;

  return (
    <>
      <GoalsSummary goals={goals} monthElapsed={monthElapsed} />
      {featured && (
        <GoalCard goal={featured} monthElapsed={monthElapsed} today={today} />
      )}
      {listed.length > 0 && (
        <GoalList
          title={featured ? "Your other goals" : "Your goals"}
          goals={listed}
          monthElapsed={monthElapsed}
          today={today}
        />
      )}
    </>
  );
}

export function GoalsOverviewSkeleton() {
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-[104px] rounded-[18px] bg-card max-lg:not-first:hidden"
          />
        ))}
      </div>
      <Skeleton className="h-52 rounded-[22px] bg-card" />
      <SectionCardSkeleton lines={3} />
    </>
  );
}
