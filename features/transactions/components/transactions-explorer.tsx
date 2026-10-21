"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { filtersQuery } from "@/features/categories/api";
import { goalsQuery } from "@/features/goals/api";
import { categoriesQuery } from "@/features/spending/api";
import type { DayKey } from "@/lib/dates";
import { formatDateRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";

import { transactionsQuery } from "../api";
import {
  filtersRange,
  isFiltered,
  parseFilters,
  toSearchParams,
  toTotalsQuery,
  toTransactionsQuery,
} from "../filters";
import type { Transaction } from "../schemas";
import { ExportButton } from "./export-button";
import {
  goalFor,
  TransactionDetailsDialog,
  TransactionDetailsPanel,
} from "./transaction-details";
import {
  type FiltersChange,
  TransactionFiltersPanel,
} from "./transaction-filters";
import {
  LIST_TITLE_ID,
  rowButtonId,
  TransactionList,
} from "./transaction-list";
import { TransactionTotals } from "./transaction-totals";

const DETAILS_ID = "transaction-details";

// The details panel fits beside the table from here; below, it's a dialog.
const WIDE = "(min-width: 1360px)";

function navigate(search: URLSearchParams, replace: boolean) {
  const query = search.toString();
  const url = query ? `?${query}` : window.location.pathname;
  if (replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
}

function focusRow(id: string) {
  const target = [
    document.getElementById(rowButtonId(id, "table")),
    document.getElementById(rowButtonId(id, "list")),
    document.getElementById(LIST_TITLE_ID),
  ].find((element) => element && element.offsetParent !== null);
  target?.focus();
}

interface TransactionsExplorerProps {
  customerId: string;
  /** The server's date, so both sides render the same range. */
  today: DayKey;
}

export function TransactionsExplorer({
  customerId,
  today,
}: TransactionsExplorerProps) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const range = filtersRange(filters, today);
  const apiQuery = toTransactionsQuery(filters, today);

  const transactions = useQuery(transactionsQuery(customerId, apiQuery));
  const totals = useQuery({
    ...categoriesQuery(customerId, toTotalsQuery(filters, today)),
    enabled: !filters.q,
  });
  const options = useQuery(filtersQuery(customerId));
  const goals = useQuery(goalsQuery(customerId));

  // A selection belongs to the results it was picked from.
  const resultsKey = JSON.stringify(apiQuery);
  const [selection, setSelection] = useState<{
    resultsKey: string;
    transaction: Transaction;
  }>();
  const selected =
    selection?.resultsKey === resultsKey ? selection.transaction : undefined;
  const select = (transaction: Transaction) =>
    setSelection({ resultsKey, transaction });

  const wide = useMediaQuery(WIDE);
  const [resetCount, setResetCount] = useState(0);

  const onChange = useCallback<FiltersChange>(
    (changes, { replace = false } = {}) =>
      navigate(toSearchParams({ ...filters, page: 1, ...changes }), replace),
    [filters],
  );
  function onReset() {
    setResetCount((count) => count + 1);
    navigate(new URLSearchParams(), false);
  }

  function closeDetails() {
    const id = selected?.id;
    setSelection(undefined);
    if (id && wide) focusRow(id);
  }

  const periodLabel =
    filters.period === "custom"
      ? "Custom range"
      : options.data?.dateRangePresets.find(
          (preset) => preset.value === filters.period,
        )?.label;
  const description = [
    periodLabel,
    formatDateRange(range.start, range.end),
    filters.q && `matching “${filters.q}”`,
  ]
    .filter(Boolean)
    .join(" · ");

  const goal = selected && goalFor(selected, goals.data?.goals, today);
  const total = transactions.data?.pagination.total;

  return (
    <>
      <PageHeader
        eyebrow="Search, filter and sort"
        title="Transactions"
        actions={
          <ExportButton
            customerId={customerId}
            query={apiQuery}
            range={range}
            disabled={!total || transactions.isPlaceholderData}
          />
        }
      />
      <div
        className={cn(
          "grid gap-4",
          wide && selected && "grid-cols-[minmax(0,1fr)_20rem] items-start",
        )}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <TransactionFiltersPanel
            filters={filters}
            today={today}
            options={options.data}
            onChange={onChange}
            onReset={isFiltered(filters) ? onReset : undefined}
            resetCount={resetCount}
          />
          <TransactionTotals
            category={filters.category}
            totals={totals.data}
            totalsFailed={totals.isError}
            count={transactions.isPlaceholderData ? undefined : total}
            searching={Boolean(filters.q)}
          />
          <TransactionList
            title={filters.category ?? "All categories"}
            description={description}
            today={today}
            sortBy={filters.sortBy}
            response={transactions.data}
            stale={transactions.isPlaceholderData}
            failed={transactions.isError}
            filtered={isFiltered(filters)}
            selectedId={selected?.id}
            detailsId={DETAILS_ID}
            detailsBeside={wide}
            onSelect={select}
            onPageChange={(page) => onChange({ page })}
            onRetry={() => void transactions.refetch()}
            onReset={onReset}
          />
        </div>
        {wide && selected && (
          <TransactionDetailsPanel
            id={DETAILS_ID}
            transaction={selected}
            goal={goal}
            onClose={closeDetails}
          />
        )}
      </div>
      {!wide && (
        <TransactionDetailsDialog
          transaction={selected}
          goal={goal}
          onClose={closeDetails}
        />
      )}
    </>
  );
}
