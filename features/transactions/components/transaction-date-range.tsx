"use client";

import { X } from "lucide-react";
import { type ChangeEvent, type ReactElement, useId, useState } from "react";
import type { DropdownProps } from "react-day-picker";

import { SelectField } from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { type DayKey, startOfDay, toDayKey, toMonthKey } from "@/lib/dates";
import { formatDay, formatMonthLong } from "@/lib/format";
import type { DayRange } from "@/lib/periods";
import { useMediaQuery } from "@/lib/use-media-query";

import { EARLIEST_DAY } from "../filters";

interface TransactionDateRangeProps {
  range: DayRange;
  today: DayKey;
  trigger: ReactElement;
  onApply: (range: DayRange) => void;
}

/** One editor shared by the desktop popover and mobile bottom sheet. */
export function TransactionDateRange({
  range,
  today,
  trigger,
  onApply,
}: TransactionDateRangeProps) {
  const mobile = useMediaQuery("(max-width: 767px)");
  const [open, setOpen] = useState(false);
  const Root = mobile ? Sheet : Popover;
  const Trigger = mobile ? SheetTrigger : PopoverTrigger;
  const Content = mobile ? SheetContent : PopoverContent;
  const Title = mobile ? SheetTitle : PopoverTitle;
  const Description = mobile ? SheetDescription : PopoverDescription;

  return (
    <Root open={open} onOpenChange={setOpen}>
      <Trigger render={trigger} />
      <Content
        {...(mobile
          ? { side: "bottom" as const, showCloseButton: false }
          : { align: "start" as const, sideOffset: 10 })}
        className={
          mobile
            ? "max-h-[calc(100dvh-1rem)] gap-0 overflow-hidden rounded-t-[22px] p-0"
            : "max-h-[min(var(--available-height),calc(100dvh-2rem))] w-[42rem] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0"
        }
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b p-4">
          <div className="space-y-1">
            <Title className="text-base font-bold">Custom date range</Title>
            <Description className="text-xs">
              Choose a start date, then an end date.
            </Description>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close date picker"
            onClick={() => setOpen(false)}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
        {open && (
          <RangeEditor
            range={range}
            today={today}
            onCancel={() => setOpen(false)}
            onApply={(next) => {
              onApply(next);
              setOpen(false);
            }}
          />
        )}
      </Content>
    </Root>
  );
}

function RangeEditor({
  range,
  today,
  onApply,
  onCancel,
}: Omit<TransactionDateRangeProps, "trigger"> & { onCancel: () => void }) {
  const [draft, setDraft] = useState(range);
  const start = startOfDay(draft.start);
  const end = draft.end ? startOfDay(draft.end) : undefined;

  return (
    <>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-4">
        <Calendar
          mode="range"
          numberOfMonths={2}
          captionLayout="dropdown"
          reverseYears
          components={{ Dropdown: RangeCalendarDropdown }}
          formatters={{
            formatMonthDropdown: (date) => formatMonthLong(toMonthKey(date)),
          }}
          showOutsideDays={false}
          timeZone="Africa/Johannesburg"
          today={startOfDay(today)}
          selected={{
            from: start,
            to: end,
          }}
          defaultMonth={startOfDay(range.start)}
          startMonth={startOfDay(EARLIEST_DAY)}
          endMonth={startOfDay(today)}
          disabled={[
            { before: startOfDay(EARLIEST_DAY) },
            { after: startOfDay(today) },
          ]}
          onDayClick={(day) => {
            const chosen = toDayKey(day);
            // A completed range starts afresh; the next click supplies its end.
            setDraft(
              !draft.end
                ? {
                    start: chosen < draft.start ? chosen : draft.start,
                    end: chosen < draft.start ? draft.start : chosen,
                  }
                : { start: chosen, end: "" },
            );
          }}
          className="w-full bg-transparent p-0 [--cell-size:--spacing(8)] [&_button[data-day]]:aspect-auto [&_button[data-day]]:h-8 [&_button[data-range-end=true]]:bg-navy [&_button[data-range-start=true]]:bg-navy"
          classNames={{
            months: "relative flex flex-col gap-6 md:flex-row md:gap-5",
            month: "flex min-w-0 flex-1 flex-col gap-3",
            nav: "pointer-events-none absolute inset-x-0 top-1.5 flex w-full items-center justify-between [&_button]:pointer-events-auto",
            month_caption: "flex h-11 w-full items-center px-8",
            dropdowns: "flex h-11 w-full items-center gap-2",
            week: "mt-1 flex w-full",
            day: "group/day relative h-8 w-full p-0 text-center",
          }}
        />
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          role="status"
          aria-label="Selected date range"
          className="min-w-0 text-xs text-muted-foreground"
          aria-live="polite"
        >
          {formatDay(draft.start)} –{" "}
          {draft.end ? formatDay(draft.end) : "Choose an end date."}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!draft.end} onClick={() => onApply(draft)}>
            Apply range
          </Button>
        </div>
      </div>
    </>
  );
}

/** Adapt DayPicker's month/year controls to the same shadcn menus as other filters. */
function RangeCalendarDropdown({
  options = [],
  value,
  onChange,
  "aria-label": label,
}: DropdownProps) {
  const id = useId();
  return (
    <SelectField
      id={id}
      label={label!}
      hideLabel
      className="flex-1"
      value={String(value)}
      items={options.map((option) => ({
        ...option,
        value: String(option.value),
      }))}
      onValueChange={(next) => {
        // DayPicker's navigation handlers read the selected value from this field.
        onChange?.({
          target: { value: next },
        } as ChangeEvent<HTMLSelectElement>);
      }}
    />
  );
}
