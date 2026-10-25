import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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
    <Card
      role="region"
      aria-labelledby={id}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-[22px] bg-card p-5 sm:p-6",
        className,
      )}
    >
      <CardHeader className="flex items-start justify-between gap-2 p-0">
        <div className="flex flex-col">
          <CardTitle>
            <h2 id={id} className="text-lg font-bold">
              {title}
            </h2>
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {link && (
          <CardAction>
            <Link
              href={link.href}
              className={cn(
                buttonVariants({ variant: "link" }),
                "-my-2.5 h-11 px-0 py-3 text-sm font-bold text-primary hover:text-primary-hover",
              )}
            >
              {link.label}
              {link.context && (
                <>
                  {" "}
                  <span className="sr-only">{link.context}</span>
                </>
              )}
            </Link>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-0">
        {children}
      </CardContent>
    </Card>
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
    <Card
      className={cn(
        "flex flex-col gap-4 rounded-[22px] bg-card p-5 sm:p-6",
        className,
      )}
    >
      <Skeleton className="h-6 w-40" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="h-5 w-full" />
      ))}
    </Card>
  );
}
