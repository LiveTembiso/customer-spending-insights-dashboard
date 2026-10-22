"use client";

import { RotateCw } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    console.error(error);
    // Move focus here so keyboard and screen reader users learn the page failed.
    heading.current?.focus();
  }, [error]);

  return (
    <section className="flex flex-col items-start gap-3 rounded-[22px] bg-card p-6">
      <h1
        ref={heading}
        tabIndex={-1}
        className="text-[22px] font-extrabold tracking-tight text-heading outline-hidden"
      >
        This page didn&apos;t load
      </h1>
      <p className="max-w-prose text-muted-foreground">
        Something went wrong on our side. Your data is safe. Try again, or come
        back in a few minutes.
      </p>
      {error.digest && (
        <p className="text-sm text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
      <Button onClick={() => retry()} className="mt-1 min-h-11 gap-2 px-5">
        <RotateCw aria-hidden className="size-4" />
        Try again
      </Button>
    </section>
  );
}
