"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

import { Button, buttonVariants } from "@/components/ui/button";

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
  modal?: boolean;
}

function TransactionDetails({
  transaction,
  goal,
  titleId,
  titleRef,
  onClose,
  modal = false,
}: DetailsProps) {
  const date = new Date(transaction.date);
  const Title = modal ? DialogTitle : "h2";

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between gap-2">
        <Title
          id={titleId}
          ref={titleRef}
          tabIndex={-1}
          className="text-base font-bold focus:outline-hidden"
        >
          Transaction details
        </Title>
        <Button
          variant="ghost"
          type="button"
          aria-label="Close details"
          onClick={onClose}
          className="-mr-2.5 flex size-11 items-center justify-center rounded-[10px] text-muted-strong hover:bg-muted"
        >
          <X aria-hidden className="size-5" />
        </Button>
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
      <Card
        role="region"
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
        <Progress
          value={Math.min(goal.percentageUsed, 100)}
          aria-label={`${goal.category} budget used`}
          aria-valuetext={`${used} percent of the ${category} budget used`}
          className="block h-2 forced-color-adjust-none"
          trackClassName={cn("h-full", tone.track)}
          indicatorClassName={cn("rounded-full", status.bar)}
        />
        <p className={cn("text-[13px] leading-[1.45]", tone.text)}>
          This purchase is {formatPercent((amount / goal.monthlyBudget) * 100)}{" "}
          of your {formatRands(goal.monthlyBudget, { cents: false })} monthly
          budget.
        </p>
      </Card>
      <Link
        href="/goals"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "flex min-h-11 items-center text-sm font-bold text-primary hover:text-primary-hover",
        )}
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
    <Card
      role="complementary"
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
    </Card>
  );
}

export function TransactionDetailsDialog({
  transaction,
  goal,
  onClose,
}: Omit<PanelProps, "id" | "transaction"> & { transaction?: Transaction }) {
  return (
    <Dialog
      open={Boolean(transaction)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-[24px] rounded-b-none bg-card px-5 pt-3 pb-[calc(2rem+env(safe-area-inset-bottom))] text-foreground sm:max-w-none md:top-1/2 md:bottom-auto md:left-1/2 md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[22px] md:p-6"
      >
        <span
          aria-hidden
          className="mx-auto mb-2 block h-1 w-10 rounded-full bg-input md:hidden"
        />
        {transaction && (
          <>
            <DialogDescription className="sr-only">
              Details for {transaction.merchant}.
            </DialogDescription>
            <TransactionDetails
              transaction={transaction}
              goal={goal}
              titleId="details-dialog-title"
              modal
              onClose={onClose}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
