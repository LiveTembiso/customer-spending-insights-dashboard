"use client";

import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CalendarDays, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { SelectField } from "@/components/select-field";
import type { FiltersResponse } from "@/features/categories/schemas";
import type { DayKey } from "@/lib/dates";
import { cn, pressedInForcedColors } from "@/lib/utils";

import { MAX_SEARCH_LENGTH } from "../constants";
import { filtersRange, SORT_LABELS, type TransactionFilters } from "../filters";
import { SORT_OPTIONS, type SortBy } from "../schemas";
import { TransactionDateRange } from "./transaction-date-range";

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

export function TransactionFiltersPanel({
  filters,
  today,
  options,
  onChange,
  onReset,
  resetCount,
}: TransactionFiltersPanelProps) {
  return (
    <Card
      role="region"
      aria-label="Filters"
      className="@container flex flex-col gap-3 rounded-[18px] bg-card p-3 md:rounded-[22px] md:p-4"
    >
      <SearchField key={resetCount} value={filters.q} onChange={onChange} />
      <div className="grid grid-cols-2 items-start gap-3 @2xl:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))]">
        <div className="col-span-2 flex min-w-0 flex-col gap-3 @2xl:col-span-1">
          <PeriodControl
            filters={filters}
            today={today}
            presets={options?.dateRangePresets ?? []}
            onChange={onChange}
          />
        </div>
        {options && (
          <CategoryFilter
            selected={filters.category}
            categories={options.categories}
            onChange={onChange}
          />
        )}
        <div className="flex min-w-0 flex-col items-stretch gap-1">
          <SortField value={filters.sortBy} onChange={onChange} />
          {onReset && (
            <Button
              variant="ghost"
              type="button"
              onClick={onReset}
              className="min-h-11 self-end px-1 text-sm font-bold text-primary hover:text-primary-hover"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </Card>
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
      className="flex min-w-0 flex-col gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        const next = draft.trim() || undefined;
        setSent(next);
        onChange({ q: next }, { replace: true });
      }}
    >
      <FieldLabel htmlFor="transaction-search" className={fieldLabel}>
        Search
      </FieldLabel>
      <InputGroup className="h-11 rounded-[10px] bg-card">
        <InputGroupAddon className="pl-3.5">
          <Search aria-hidden className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          id="transaction-search"
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Merchant or description"
          maxLength={MAX_SEARCH_LENGTH}
          autoComplete="off"
          className="h-full text-base md:text-sm"
        />
      </InputGroup>
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
      "flex h-full min-h-0 items-center justify-center gap-1.5 rounded-[9px] border border-transparent px-3 text-[13px] whitespace-nowrap",
      pressed
        ? cn(
            "bg-navy font-bold text-navy-foreground data-pressed:bg-navy data-pressed:text-navy-foreground data-pressed:hover:bg-navy",
            pressedInForcedColors,
          )
        : "font-semibold text-muted-strong hover:bg-card",
    );

  return (
    <Field className="min-w-0 gap-1.5">
      <span id={labelId} className={fieldLabel}>
        Period
      </span>
      <ToggleGroup
        value={[filters.period]}
        onValueChange={(values) => {
          const period = values[0];
          if (!period) return;
          const preset = presets.find((item) => item.value === period);
          if (preset) onChange({ period: preset.value, range: undefined });
        }}
        aria-labelledby={labelId}
        className="grid h-11 w-full grid-cols-5 gap-0.5 rounded-[12px] bg-background p-0.75"
      >
        {presets.map((preset) => (
          <ToggleGroupItem
            key={preset.value}
            type="button"
            value={preset.value}
            className={segment(filters.period === preset.value)}
          >
            {/* The short label starts the accessible name, so voice control can use it. */}
            <span>{preset.value}</span>
            <span className="sr-only">, {preset.label}</span>
          </ToggleGroupItem>
        ))}
        <TransactionDateRange
          range={filtersRange(filters, today)}
          today={today}
          onApply={(range) => onChange({ period: "custom", range })}
          trigger={
            <ToggleGroupItem
              type="button"
              value="custom"
              aria-label="Custom range"
              className={segment(filters.period === "custom")}
            >
              <CalendarDays aria-hidden className="size-4" />
            </ToggleGroupItem>
          }
        />
      </ToggleGroup>
    </Field>
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
    <SelectField
      id="transaction-sort"
      label="Sort by"
      value={value}
      items={SORT_OPTIONS.map((option) => ({
        value: option,
        label: SORT_LABELS[option],
      }))}
      onValueChange={(sortBy) => onChange({ sortBy: sortBy as SortBy })}
    />
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
  return (
    <SelectField
      id="transaction-category"
      label="Category"
      value={selected ?? ""}
      items={[
        { value: "", label: "All categories" },
        ...categories.map(({ name }) => ({ value: name, label: name })),
      ]}
      onValueChange={(category) =>
        onChange({
          category: (category as TransactionFilters["category"]) || undefined,
        })
      }
    />
  );
}
