"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  items: { value: string; label: string; disabled?: boolean }[];
  onValueChange: (value: string) => void;
  className?: string;
  hideLabel?: boolean;
}

/** Shared labelled dropdown; its popup and keyboard handling both come from shadcn. */
export function SelectField({
  id,
  label,
  value,
  items,
  onValueChange,
  className,
  hideLabel = false,
}: SelectFieldProps) {
  return (
    <Field className={cn("min-w-0 gap-1.5", className)}>
      <FieldLabel
        htmlFor={id}
        className={cn(
          "text-xs font-semibold text-muted-foreground",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </FieldLabel>
      <Select
        items={items}
        value={value}
        // Every item has a string value, and this select has no clear action.
        onValueChange={(next) => onValueChange(next!)}
      >
        <SelectTrigger id={id}>
          <SelectValue className="min-w-0 truncate" />
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="max-w-[calc(100vw-2rem)] min-w-max"
        >
          <SelectGroup>
            {items.map((item) => (
              <SelectItem
                key={item.value}
                value={item.value}
                disabled={item.disabled}
              >
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
