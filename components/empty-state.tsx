import type { ReactNode } from "react";

import { Empty, EmptyContent, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export function EmptyState({
  message,
  children,
  className,
}: {
  message: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("items-start gap-3 p-0 text-left", className)}>
      <EmptyDescription>{message}</EmptyDescription>
      {children && (
        <EmptyContent className="max-w-none items-start">
          {children}
        </EmptyContent>
      )}
    </Empty>
  );
}
