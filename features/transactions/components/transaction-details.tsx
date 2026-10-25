"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { type RefObject, useEffect, useRef } from "react";

import { CategoryDot } from "@/features/categories/components/category-dot";
import type { Goal } from "@/features/goals/schemas";
import { GOAL_STATUS } from "@/features/goals/status";
import { type DayKey, toDayKey, toMonthKey, toTimeOfDay } from "@/lib/dates";
import { formatDay, formatPercent, formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { Transaction } from "../schemas";
import { debit, MerchantAvatar } from "./transaction-parts";

/** The goal a purchase counts towards: same category, this month. */
export function goalFor(
  transaction: Transaction,
  goals: readonly Goal[] | undefined,
  today: DayKey,
): Goal | undefined {
  if (toMonthKey(new Date(transaction.date)) !== today.slice(0, 7)) {
    return undefined;
  }
  return goals?.find((goal) => goal.category === transaction.category);
}

interface DetailsProps {
  transaction: Transaction;
  goal?: Goal;
  titleId: string;
  titleRef?: RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
}

function TransactionDetails({
  transaction,
  goal,
  titleId,
  titleRef,
  onClose,
}: DetailsProps) {
  const date = new Date(transaction.date);

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between gap-2">
        <h2
          id={titleId}
          ref={titleRef}
          tabIndex={-1}
          className="text-base font-bold focus:outline-hidden"
        >
          Transaction details
        </h2>
        <button
          type="button"
          aria-label="Close details"
          onClick={onClose}
          className="-mr-2.5 flex size-11 items-center justify-center rounded-[10px] text-muted-strong hover:bg-muted"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <MerchantAvatar
          transaction={transaction}
          className="size-12 rounded-[12px] text-base"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[17px] font-bold">{transaction.merchant}</span>
          <span className="text-[28px] leading-[1.1] font-extrabold tracking-tight tabular-nums">
            {debit(transaction.amount)}
          </span>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 border-t border-background pt-4 text-sm [&_dd]:text-right [&_dd]:font-semibold [&_dt]:text-muted-foreground">
        <dt>Date</dt>
        <dd className="tabular-nums">
          {formatDay(toDayKey(date))}, {toTimeOfDay(date)}
        </dd>
        <dt>Category</dt>
        <dd className="flex items-center justify-end gap-2">
          <CategoryDot color={transaction.categoryColor} />
          {transaction.category}
        </dd>
        <dt>Description</dt>
        <dd>{transaction.description}</dd>
        <dt>Paid with</dt>
        <dd>{transaction.paymentMethod}</dd>
        <dt>Reference</dt>
        <dd className="font-mono text-[13px] break-all">{transaction.id}</dd>
      </dl>
      {goal && <GoalImpact goal={goal} amount={transaction.amount} />}
    </div>
  );
}

function GoalImpact({ goal, amount }: { goal: Goal; amount: number }) {
  const status = GOAL_STATUS[goal.status];
  const tone = status.detail;
  const Icon = status.icon;
  const used = Math.round(goal.percentageUsed);
  const category = goal.category.toLowerCase();

  return (
    <>
      <section
        aria-labelledby="goal-impact-title"
        className={cn(
          "flex flex-col gap-2 rounded-[14px] border p-3.5",
          tone.box,
        )}
      >
        <h3
          id="goal-impact-title"
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-bold",
            tone.title,
          )}
        >
          <Icon aria-hidden className="size-4" />
          {goal.category} goal · {used}% used
          <span className="sr-only">, {status.label.toLowerCase()}</span>
        </h3>
        <div
          role="img"
          aria-label={`${used} percent of the ${category} budget used`}
          className={cn(
            "h-2 overflow-hidden rounded-full forced-color-adjust-none",
            tone.track,
          )}
        >
          <div
            className={cn("h-full rounded-full", status.bar)}
            style={{ width: `${Math.min(goal.percentageUsed, 100)}%` }}
          />
        </div>
        <p className={cn("text-[13px] leading-[1.45]", tone.text)}>
          This purchase is {formatPercent((amount / goal.monthlyBudget) * 100)}{" "}
          of your {formatRands(goal.monthlyBudget, { cents: false })} monthly
          budget.
        </p>
      </section>
      <Link
        href="/goals"
        className="flex min-h-11 items-center text-sm font-bold text-primary hover:text-primary-hover"
      >
        View {category} goal
      </Link>
    </>
  );
}

interface PanelProps {
  id: string;
  transaction: Transaction;
  goal?: Goal;
  onClose: () => void;
}

export function TransactionDetailsPanel({
  id,
  transaction,
  goal,
  onClose,
}: PanelProps) {
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    title.current?.focus();
  }, [transaction.id]);

  return (
    <aside
      id={id}
      aria-labelledby="details-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
      className="sticky top-7 rounded-[22px] bg-card p-6"
    >
      <TransactionDetails
        transaction={transaction}
        goal={goal}
        titleId="details-title"
        titleRef={title}
        onClose={onClose}
      />
    </aside>
  );
}

export function TransactionDetailsDialog({
  transaction,
  goal,
  onClose,
}: Omit<PanelProps, "id" | "transaction"> & { transaction?: Transaction }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (transaction && !element.open) element.showModal();
    if (!transaction && element.open) element.close();
  }, [transaction]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="details-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        // Only the backdrop reaches the dialog itself; its padding is on the inner div.
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="mx-0 mt-auto mb-0 max-h-[90dvh] w-full max-w-none rounded-t-[24px] bg-card p-0 text-foreground backdrop:bg-navy/55 md:m-auto md:max-w-md md:rounded-[22px]"
    >
      <div className="px-5 pt-3 pb-[calc(2rem+env(safe-area-inset-bottom))] md:p-6">
        <span
          aria-hidden
          className="mx-auto mb-2 block h-1 w-10 rounded-full bg-input md:hidden"
        />
        {transaction && (
          <TransactionDetails
            transaction={transaction}
            goal={goal}
            titleId="details-dialog-title"
            onClose={() => dialog.current?.close()}
          />
        )}
      </div>
    </dialog>
  );
}
