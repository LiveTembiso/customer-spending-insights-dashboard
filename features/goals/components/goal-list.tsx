import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { SectionCard } from "@/components/layout/section-card";
import type { DayKey } from "@/lib/dates";
import { formatRands } from "@/lib/format";

import { purchasesHref } from "../links";
import type { Goal } from "../schemas";
import { GoalIcon, PaceBar, remaining, StatusPill } from "./goal-parts";

interface GoalListProps {
  title: string;
  goals: readonly Goal[];
  monthElapsed: number;
  today: DayKey;
}

export function GoalList({ title, goals, monthElapsed, today }: GoalListProps) {
  return (
    <SectionCard
      id="goal-list-title"
      title={title}
      description="Most urgent first"
    >
      <ul className="-mt-1 flex flex-col">
        {goals.map((goal) => {
          const left = remaining(goal);
          const id = (part: string) => `${goal.id}-${part}`;
          return (
            <li key={goal.id} className="border-t border-background">
              <Link
                href={purchasesHref(goal.category, today)}
                // Named by category and action; the figures describe it, so
                // the name stays short.
                aria-labelledby={`${id("name")} ${id("cue")}`}
                aria-describedby={`${id("status")} ${id("used")} ${id("left")}`}
                className="group -mx-3 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2.5 rounded-[12px] px-3 py-3.5 hover:bg-background lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] lg:gap-x-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <GoalIcon goal={goal} className="size-9 rounded-[10px]" />
                  <div className="flex min-w-0 flex-col items-start gap-1">
                    <span id={id("name")} className="font-bold">
                      {goal.category}
                    </span>{" "}
                    <StatusPill goal={goal} id={id("status")} />
                  </div>
                </div>

                <div className="col-span-full row-start-2 flex flex-col gap-1.5 lg:col-span-1 lg:col-start-2 lg:row-start-1">
                  <PaceBar
                    goal={goal}
                    monthElapsed={monthElapsed}
                    className="h-2"
                    decorative
                  />
                  <span
                    id={id("used")}
                    className="text-[13px] text-muted-foreground tabular-nums"
                  >
                    <b className="font-bold text-foreground">
                      {formatRands(goal.currentSpent)}
                    </b>{" "}
                    of {formatRands(goal.monthlyBudget, { cents: false })} ·{" "}
                    {Math.round(goal.percentageUsed)}% used
                  </span>
                </div>

                <div
                  id={id("left")}
                  className="flex flex-col items-end text-right lg:items-start lg:text-left"
                >
                  <span className="whitespace-nowrap">
                    <span className="font-extrabold tabular-nums">
                      {left.amount}
                    </span>{" "}
                    <span className="text-[13px] text-muted-foreground">
                      {left.label}
                    </span>
                  </span>{" "}
                  {left.perDay && (
                    <span className="text-[13px] text-muted-foreground">
                      {left.perDay}
                    </span>
                  )}
                </div>

                <span className="flex items-center">
                  <span
                    id={id("cue")}
                    className="sr-only text-sm font-bold text-primary group-hover:text-primary-hover sm:not-sr-only"
                  >
                    See purchases
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="size-4 text-muted-foreground sm:hidden"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
