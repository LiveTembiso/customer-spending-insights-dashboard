import Link from "next/link";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  id: string;
  title: string;
  description?: string;
  link?: { href: string; label: string; context?: string };
  className?: string;
  children: ReactNode;
}

export function SectionCard({
  id,
  title,
  description,
  link,
  className,
  children,
}: SectionCardProps) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-[22px] bg-card p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <h2 id={id} className="text-lg font-bold">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {link && (
          <Link
            href={link.href}
            className="-my-2.5 py-3 text-sm font-bold text-primary hover:text-primary-hover"
          >
            {link.label}
            {link.context && (
              <>
                {" "}
                <span className="sr-only">{link.context}</span>
              </>
            )}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function SectionCardSkeleton({
  className,
  lines = 4,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[22px] bg-card p-5 sm:p-6",
        className,
      )}
    >
      <Skeleton className="h-6 w-40" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="h-5 w-full" />
      ))}
    </div>
  );
}
