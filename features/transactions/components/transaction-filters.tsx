"use client";

import { CalendarDays, Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { NativeSelect } from "@/components/ui/native-select";
import { CategoryDot } from "@/features/categories/components/category-dot";
import type { FiltersResponse } from "@/features/categories/schemas";
import type { DayKey } from "@/lib/dates";
import { formatDay } from "@/lib/format";
import { cn, pressedInForcedColors } from "@/lib/utils";

import {
  EARLIEST_DAY,
  filtersRange,
  SORT_LABELS,
  type TransactionFilters,
} from "../filters";
import { SORT_OPTIONS, type SortBy } from "../schemas";

const SEARCH_DELAY_MS = 300;

export type FiltersChange = (
  changes: Partial<TransactionFilters>,
  options?: { replace?: boolean },
) => void;

interface TransactionFiltersPanelProps {
  filters: TransactionFilters;
  today: DayKey;
  options?: FiltersResponse;
  onChange: FiltersChange;
  onReset?: () => void;
  /** Changes on every reset, so a half-typed search is dropped too. */
  resetCount: number;
}

const fieldLabel = "text-xs font-semibold text-muted-foreground";
const control =
  "min-h-11 rounded-[10px] border border-input bg-card px-3 text-base text-foreground md:text-sm";

export function TransactionFiltersPanel({
  filters,
  today,
  options,
  onChange,
  onReset,
  resetCount,
}: TransactionFiltersPanelProps) {
  return (
    <section
      aria-label="Filters"
      className="flex flex-col gap-4 rounded-[18px] bg-card p-4 md:rounded-[22px] md:px-5.5 md:py-5"
    >
      <div className="flex flex-wrap items-end gap-3">
        <SearchField key={resetCount} value={filters.q} onChange={onChange} />
        <SortField value={filters.sortBy} onChange={onChange} />
      </div>
      <div className="flex flex-wrap items-start gap-3">
        <PeriodControl
          filters={filters}
          today={today}
          presets={options?.dateRangePresets ?? []}
          onChange={onChange}
        />
        {filters.period === "custom" && (
          <CustomRange
            range={filtersRange(filters, today)}
            today={today}
            onChange={onChange}
          />
        )}
      </div>
      <div className="flex flex-col items-start gap-2 md:flex-row md:justify-between md:gap-3">
        {options && (
          <CategoryFilter
            selected={filters.category}
            categories={options.categories}
            onChange={onChange}
          />
        )}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-11 shrink-0 px-1 text-sm font-bold text-primary hover:text-primary-hover"
          >
            Clear filters
          </button>
        )}
      </div>
    </section>
  );
}

function SearchField({
  value,
  onChange,
}: {
  value?: string;
  onChange: FiltersChange;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const [applied, setApplied] = useState(value);
  const [sent, setSent] = useState(value);

  // The URL changed without typing (back button, Clear filters): follow it.
  // Our own search arriving late is skipped, so it can't undo newer typing.
  if (value !== applied) {
    setApplied(value);
    if (value !== sent && draft.trim() !== (value ?? "")) setDraft(value ?? "");
  }

  useEffect(() => {
    const next = draft.trim() || undefined;
    if (next === value) return;
    const timer = setTimeout(() => {
      setSent(next);
      onChange({ q: next }, { replace: true });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, value, onChange]);

  return (
    <form
      role="search"
      className="flex min-w-[min(100%,14rem)] flex-1 flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        const next = draft.trim() || undefined;
        setSent(next);
        onChange({ q: next }, { replace: true });
      }}
    >
      <label htmlFor="transaction-search" className={fieldLabel}>
        Search
      </label>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id="transaction-search"
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Merchant or description"
          maxLength={100}
          autoComplete="off"
          className={cn(
            control,
            "w-full pl-10 placeholder:text-muted-foreground",
          )}
        />
      </div>
    </form>
  );
}

function PeriodControl({
  filters,
  today,
  presets,
  onChange,
}: {
  filters: TransactionFilters;
  today: DayKey;
  presets: FiltersResponse["dateRangePresets"];
  onChange: FiltersChange;
}) {
  const labelId = useId();
  const segment = (pressed: boolean) =>
    cn(
      "flex min-h-11 items-center justify-center gap-1.5 rounded-[9px] border border-transparent px-3 text-[13px] whitespace-nowrap",
      pressed
        ? cn("bg-navy font-bold text-navy-foreground", pressedInForcedColors)
        : "font-semibold text-muted-strong hover:bg-card",
    );

  return (
    <div className="flex w-full flex-col gap-1.5 lg:w-auto">
      <span id={labelId} className={fieldLabel}>
        Period
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="grid grid-cols-5 gap-0.5 rounded-[12px] bg-background p-0.75 lg:flex"
      >
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            aria-pressed={filters.period === preset.value}
            onClick={() => onChange({ period: preset.value, range: undefined })}
            className={segment(filters.period === preset.value)}
          >
            {/* The short label starts the accessible name, so voice control can use it. */}
            <span className="lg:hidden">{preset.value}</span>
            <span className="sr-only lg:not-sr-only">
              <span className="lg:hidden">, </span>
              {preset.label}
            </span>
          </button>
        ))}
        <button
          type="button"
          aria-pressed={filters.period === "custom"}
          aria-label="Custom range"
          onClick={() =>
            onChange({
              period: "custom",
              range: filtersRange(filters, today),
            })
          }
          className={segment(filters.period === "custom")}
        >
          <CalendarDays aria-hidden className="size-4 lg:size-3.5" />
          <span aria-hidden className="hidden lg:inline">
            Custom
          </span>
        </button>
      </div>
    </div>
  );
}

function CustomRange({
  range,
  today,
  onChange,
}: {
  range: { start: DayKey; end: DayKey };
  today: DayKey;
  onChange: FiltersChange;
}) {
  const [draft, setDraft] = useState(range);
  const [applied, setApplied] = useState(range);
  if (range.start !== applied.start || range.end !== applied.end) {
    setApplied(range);
    setDraft(range);
  }

  const problem = (range: { start: DayKey; end: DayKey }) =>
    !range.start || !range.end
      ? "Choose both dates."
      : range.start < EARLIEST_DAY || range.end > today
        ? `Choose dates from ${formatDay(EARLIEST_DAY)} to today.`
        : range.start > range.end
          ? "Choose a start date on or before the end date."
          : undefined;
  const error = problem(draft);

  // Typing a year passes through dates like 0002-09-01; only real ones apply.
  function update(next: { start: DayKey; end: DayKey }) {
    setDraft(next);
    if (!problem(next)) onChange({ range: next }, { replace: true });
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="sr-only">Custom range</legend>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="range-start" className={fieldLabel}>
            From
          </label>
          <input
            id="range-start"
            type="date"
            value={draft.start}
            min={EARLIEST_DAY}
            max={today}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "range-error" : undefined}
            onChange={(event) =>
              update({ ...draft, start: event.target.value })
            }
            className={cn(control, "w-full min-w-0 px-2 tabular-nums")}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="range-end" className={fieldLabel}>
            To
          </label>
          <input
            id="range-end"
            type="date"
            value={draft.end}
            min={EARLIEST_DAY}
            max={today}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "range-error" : undefined}
            onChange={(event) => update({ ...draft, end: event.target.value })}
            className={cn(control, "w-full min-w-0 px-2 tabular-nums")}
          />
        </div>
      </div>
      {error && (
        <p
          id="range-error"
          role="alert"
          className="text-sm font-semibold text-destructive"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

function SortField({
  value,
  onChange,
}: {
  value: SortBy;
  onChange: FiltersChange;
}) {
  return (
    <div className="flex items-center justify-between gap-3 max-sm:w-full sm:flex-col sm:items-stretch sm:gap-1.5">
      <label htmlFor="transaction-sort" className={fieldLabel}>
        Sort by
      </label>
      <NativeSelect
        id="transaction-sort"
        value={value}
        onChange={(event) => onChange({ sortBy: event.target.value as SortBy })}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {SORT_LABELS[option]}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

function CategoryFilter({
  selected,
  categories,
  onChange,
}: {
  selected?: string;
  categories: FiltersResponse["categories"];
  onChange: FiltersChange;
}) {
  const chip = (pressed: boolean) =>
    cn(
      "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] md:text-sm",
      pressed
        ? cn(
            "border-navy bg-navy font-bold text-navy-foreground",
            pressedInForcedColors,
          )
        : "border-border bg-card font-semibold text-muted-strong hover:border-input",
    );

  return (
    <>
      <div className="flex w-full flex-col gap-1.5 md:hidden">
        <label htmlFor="transaction-category" className={fieldLabel}>
          Category
        </label>
        <NativeSelect
          id="transaction-category"
          value={selected ?? ""}
          onChange={(event) =>
            onChange({
              category:
                (event.target.value as TransactionFilters["category"]) ||
                undefined,
            })
          }
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.name} value={category.name}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div
        role="group"
        aria-label="Category"
        className="hidden min-w-0 flex-1 flex-wrap gap-2 md:flex"
      >
        <button
          type="button"
          aria-pressed={!selected}
          onClick={() => onChange({ category: undefined })}
          className={chip(!selected)}
        >
          All
        </button>
        {categories.map((category) => {
          const pressed = category.name === selected;
          return (
            <button
              key={category.name}
              type="button"
              aria-pressed={pressed}
              onClick={() =>
                onChange({ category: pressed ? undefined : category.name })
              }
              className={cn(chip(pressed), pressed && "pr-3")}
            >
              <CategoryDot
                color={category.color}
                className={cn(
                  pressed && "shadow-[0_0_0_1.5px_rgba(255,255,255,0.7)]",
                )}
              />
              {category.name}
              {pressed && (
                <X aria-hidden className="size-3.5" strokeWidth={2.5} />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
