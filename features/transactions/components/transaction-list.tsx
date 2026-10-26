"use client";
import { EmptyState } from "@/components/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Item } from "@/components/ui/item";

import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Fragment, useRef } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { type DayKey, toDayKey, toTimeOfDay } from "@/lib/dates";
import { formatDay, formatDayHeading } from "@/lib/format";
import { cn } from "@/lib/utils";

import { PAGE_SIZE } from "../constants";
import type {
  Pagination as PaginationData,
  SortBy,
  Transaction,
  TransactionsResponse,
} from "../schemas";
import { CategoryPill, debit, MerchantAvatar } from "./transaction-parts";

export const LIST_TITLE_ID = "transactions-title";

export const rowButtonId = (id: string, layout: "table" | "list") =>
  `${id}-${layout}`;

interface TransactionListProps {
  title: string;
  description: string;
  today: DayKey;
  sortBy: SortBy;
  page: number;
  response?: TransactionsResponse;
  /** The response is for the previous filters while new ones load. */
  stale: boolean;
  failed: boolean;
  filtered: boolean;
  selectedId?: string;
  detailsId: string;
  /** Details open beside the table rather than in a dialog. */
  detailsBeside: boolean;
  onSelect: (transaction: Transaction) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onReset: () => void;
}

export function TransactionList(props: TransactionListProps) {
  const { title, description, response, stale } = props;
  const heading = useRef<HTMLHeadingElement>(null);
  const count = response?.pagination.total;

  // Previous and Next can disable themselves, so focus moves to the new page.
  function changePage(page: number) {
    props.onPageChange(page);
    heading.current?.focus();
  }

  return (
    <Card
      role="region"
      aria-labelledby={LIST_TITLE_ID}
      aria-busy={stale}
      className="flex min-w-0 scroll-mt-4 flex-col gap-3.5 rounded-[18px] bg-card p-4 md:rounded-[22px] md:p-5.5"
    >
      <div className="flex flex-col gap-0.5">
        <h2
          id={LIST_TITLE_ID}
          ref={heading}
          tabIndex={-1}
          className="scroll-mt-4 text-base font-bold focus:outline-hidden md:text-lg"
        >
          {title}
        </h2>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      <p role="status" className="sr-only">
        {count === undefined || stale
          ? ""
          : `${count} ${count === 1 ? "transaction" : "transactions"} found`}
      </p>

      <ListBody {...props} onPageChange={changePage} />

      {response && response.pagination.total > PAGE_SIZE && (
        <Pagination
          page={props.page}
          pagination={response.pagination}
          shown={response.transactions.length}
          onPageChange={changePage}
        />
      )}
    </Card>
  );
}

function ListBody(props: TransactionListProps) {
  const { response, failed, filtered } = props;

  if (!response) {
    return failed ? <LoadError onRetry={props.onRetry} /> : <ListSkeleton />;
  }

  if (response.transactions.length === 0) {
    const pastLastPage = response.pagination.total > 0;
    return (
      <EmptyState
        className="rounded-[14px] bg-muted p-5"
        message={
          pastLastPage
            ? "There's nothing on this page."
            : filtered
              ? "No transactions match these filters."
              : "No transactions in this period."
        }
      >
        {(pastLastPage || filtered) && (
          <Button
            variant="ghost"
            type="button"
            onClick={pastLastPage ? () => props.onPageChange(1) : props.onReset}
            className="min-h-11 rounded-[12px] border-[1.5px] border-navy bg-card px-4 text-sm font-bold"
          >
            {pastLastPage ? "Go to the first page" : "Clear filters"}
          </Button>
        )}
      </EmptyState>
    );
  }

  return (
    <div
      className={cn(
        "transition-opacity",
        props.stale && "opacity-60 motion-reduce:transition-none",
      )}
    >
      <TransactionTable {...props} transactions={response.transactions} />
      <TransactionItems {...props} transactions={response.transactions} />
    </div>
  );
}

type RowsProps = TransactionListProps & { transactions: Transaction[] };

function TransactionTable({
  transactions,
  selectedId,
  detailsId,
  detailsBeside,
  onSelect,
}: RowsProps) {
  return (
    <div className="hidden lg:block">
      <Table
        aria-labelledby={LIST_TITLE_ID}
        className="w-full border-collapse text-sm"
      >
        <TableHeader>
          <TableRow className="bg-muted text-left text-[13px] text-muted-foreground">
            <TableHead
              scope="col"
              className="rounded-l-lg px-2 py-2.5 font-semibold"
            >
              Date
            </TableHead>
            <TableHead scope="col" className="px-2 py-2.5 font-semibold">
              Merchant
            </TableHead>
            <TableHead scope="col" className="px-2 py-2.5 font-semibold">
              Category
            </TableHead>
            <TableHead scope="col" className="px-2 py-2.5 font-semibold">
              Description
            </TableHead>
            <TableHead scope="col" className="px-2 py-2.5 font-semibold">
              Paid with
            </TableHead>
            <TableHead
              scope="col"
              className="rounded-r-lg px-2 py-2.5 text-right font-semibold"
            >
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {transactions.map((transaction) => {
            const selected = transaction.id === selectedId;
            const date = new Date(transaction.date);
            return (
              <TableRow
                key={transaction.id}
                aria-current={selected || undefined}
                className={cn(
                  "border-b border-background last:border-b-0",
                  selected && "bg-accent",
                )}
              >
                <TableCell
                  className={cn(
                    "px-2 py-2 whitespace-nowrap",
                    selected &&
                      "shadow-[inset_3px_0_0_var(--primary)] forced-colors:border-l-4 forced-colors:border-l-[Highlight]",
                  )}
                >
                  <span className="flex flex-col">
                    <span className="text-muted-strong">
                      {formatDay(toDayKey(date))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {toTimeOfDay(date)}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Button
                    variant="ghost"
                    id={rowButtonId(transaction.id, "table")}
                    type="button"
                    aria-expanded={detailsBeside ? selected : undefined}
                    aria-controls={
                      detailsBeside && selected ? detailsId : undefined
                    }
                    aria-haspopup={detailsBeside ? undefined : "dialog"}
                    onClick={() => onSelect(transaction)}
                    className="inline-flex h-auto min-h-11 items-center gap-2.5 rounded-[8px] text-left font-bold whitespace-normal hover:text-primary"
                  >
                    <MerchantAvatar transaction={transaction} />
                    {transaction.merchant}
                  </Button>
                </TableCell>
                <TableCell className="px-2 py-2">
                  <CategoryPill
                    transaction={transaction}
                    className={cn(selected && "bg-card")}
                  />
                </TableCell>
                <TableCell className="px-2 py-2 text-muted-strong">
                  {transaction.description}
                </TableCell>
                <TableCell className="px-2 py-2 text-muted-strong">
                  {transaction.paymentMethod}
                </TableCell>
                <TableCell className="px-2 py-2 text-right font-bold whitespace-nowrap">
                  {debit(transaction.amount)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function TransactionItems({
  transactions,
  today,
  sortBy,
  selectedId,
  onSelect,
}: RowsProps) {
  const byDate = sortBy === "date_desc" || sortBy === "date_asc";

  const item = (transaction: Transaction) => {
    const date = new Date(transaction.date);
    const when = byDate ? toTimeOfDay(date) : formatDay(toDayKey(date));
    return (
      <li key={transaction.id}>
        <Item
          render={<Button variant="ghost" type="button" />}
          id={rowButtonId(transaction.id, "list")}
          aria-haspopup="dialog"
          onClick={() => onSelect(transaction)}
          className={cn(
            "-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3 rounded-[12px] px-2 py-2.5 text-left",
            transaction.id === selectedId && "bg-accent",
          )}
        >
          <MerchantAvatar
            transaction={transaction}
            className="size-9 rounded-[10px]"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-bold">{transaction.merchant}</span>
            <span className="truncate text-xs text-muted-foreground">
              {transaction.description} · {when}
            </span>
          </span>
          <span className="font-bold whitespace-nowrap tabular-nums">
            {debit(transaction.amount)}
          </span>
        </Item>
      </li>
    );
  };

  if (!byDate) {
    return (
      <ul className="flex flex-col lg:hidden">{transactions.map(item)}</ul>
    );
  }

  const groups: { day: DayKey; items: Transaction[] }[] = [];
  for (const transaction of transactions) {
    const day = toDayKey(new Date(transaction.date));
    const last = groups.at(-1);
    if (last?.day === day) last.items.push(transaction);
    else groups.push({ day, items: [transaction] });
  }

  return (
    <div className="flex flex-col lg:hidden">
      {groups.map((group, index) => (
        <Fragment key={group.day}>
          <h3
            className={cn(
              "pt-2.5 pb-1 text-xs font-bold tracking-[0.06em] text-muted-foreground uppercase",
              index > 0 && "border-t border-background",
            )}
          >
            {formatDayHeading(group.day, today)}
          </h3>
          <ul className="flex flex-col">{group.items.map(item)}</ul>
        </Fragment>
      ))}
    </div>
  );
}

// `page` comes from the URL, so quick clicks step on from the page asked for,
// not from the one still on screen while it loads.
function Pagination({
  page,
  pagination,
  shown,
  onPageChange,
}: {
  page: number;
  pagination: PaginationData;
  shown: number;
  onPageChange: (page: number) => void;
}) {
  const { offset, total } = pagination;
  const pages = Math.ceil(total / PAGE_SIZE);
  const button =
    "flex min-h-11 items-center gap-1 rounded-[10px] border text-sm disabled:border-border disabled:bg-muted disabled:font-semibold disabled:text-muted-foreground";

  return (
    <PaginationRoot
      aria-label="Pages"
      className="flex flex-wrap items-center justify-between gap-3 pt-1"
    >
      <span className="text-[13px] text-muted-foreground tabular-nums">
        {shown > 0
          ? `Showing ${offset + 1}–${offset + shown} of ${total}`
          : `${total} in total`}
      </span>
      <PaginationContent className="gap-2">
        <PaginationItem>
          <Button
            variant="ghost"
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.min(page - 1, pages))}
            className={cn(
              button,
              "border-navy bg-card pr-3.5 pl-2.5 font-bold",
            )}
          >
            <ChevronLeft aria-hidden className="size-4" />
            Previous
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span className="px-1 text-[13px] text-muted-strong tabular-nums">
            Page {page} of {pages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <Button
            variant="ghost"
            type="button"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className={cn(
              button,
              "border-navy bg-card pr-2.5 pl-3.5 font-bold",
            )}
          >
            Next
            <ChevronRight aria-hidden className="size-4" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert
      role="alert"
      className="flex flex-col items-start gap-3 rounded-[14px] bg-muted p-5"
    >
      <AlertDescription className="font-semibold text-foreground">
        Your transactions didn&apos;t load.
      </AlertDescription>
      <Button
        variant="ghost"
        type="button"
        onClick={onRetry}
        className="flex min-h-11 items-center gap-2 rounded-[12px] bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover"
      >
        <RotateCw aria-hidden className="size-4" />
        Try again
      </Button>
    </Alert>
  );
}

export function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-[10px]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
