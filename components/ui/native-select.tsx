import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** A native select with the chevron inset as far as the text (12px). */
export function NativeSelect({
  className,
  ...props
}: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "min-h-11 w-full appearance-none rounded-[10px] border border-input bg-card pr-9 pl-3 text-base text-foreground md:text-sm",
          className,
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
