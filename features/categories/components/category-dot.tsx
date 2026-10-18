import { cn } from "@/lib/utils";

// API colours are used as sent and some are too pale on white, hence the ring.
export function CategoryDot({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2.5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(14,27,44,0.25)]",
        className,
      )}
      style={{ backgroundColor: color }}
    />
  );
}
