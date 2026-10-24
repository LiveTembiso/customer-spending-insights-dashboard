import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { SectionCard } from "@/components/layout/section-card";
import { CategoryIcon } from "@/features/categories/components/category-icon";
import { formatDayRange, formatRands } from "@/lib/format";

import { purchasesHref } from "../links";
import { getCurrentUntrackedSpending } from "../server/current";

export async function UntrackedSpending() {
  const spending = await getCurrentUntrackedSpending();
  if (!spending) return null;
  const { startDate, endDate } = spending.dateRange;

  return (
    <SectionCard
      id="untracked-title"
      title="Spending without a goal"
      description={`This month so far, ${formatDayRange(startDate, endDate)}`}
    >
      {spending.categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing yet this month outside your goals.
        </p>
      ) : (
        <ul className="-mt-1 flex flex-col">
          {spending.categories.map((category) => {
            const id = (part: string) => `untracked-${category.name}-${part}`;
            return (
              <li key={category.name} className="border-t border-background">
                <Link
                  href={purchasesHref(category.name, endDate)}
                  aria-labelledby={`${id("name")} ${id("cue")}`}
                  aria-describedby={`${id("count")} ${id("amount")}`}
                  className="group -mx-3 flex min-h-14 items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-background sm:gap-3.5"
                >
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-navy shadow-[inset_0_0_0_1px_rgba(14,27,44,0.25)] forced-color-adjust-none"
                    style={{ backgroundColor: category.color }}
                  >
                    <CategoryIcon
                      name={category.icon}
                      className="size-[18px]"
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span id={id("name")} className="font-bold">
                      {category.name}
                    </span>
                    <span
                      id={id("count")}
                      className="text-[13px] text-muted-foreground"
                    >
                      {category.transactionCount}{" "}
                      {category.transactionCount === 1
                        ? "transaction"
                        : "transactions"}
                    </span>
                  </span>
                  <span
                    id={id("amount")}
                    className="font-extrabold tabular-nums"
                  >
                    {formatRands(category.amount)}
                  </span>
                  <span
                    id={id("cue")}
                    className="sr-only pl-2 text-sm font-bold text-primary group-hover:text-primary-hover sm:not-sr-only"
                  >
                    See purchases
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="size-4 text-muted-foreground sm:hidden"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
