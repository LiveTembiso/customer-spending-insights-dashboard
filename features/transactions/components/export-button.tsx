"use client";

import { Button } from "@/components/ui/button";

import { Download, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { DayRange } from "@/lib/periods";

import { downloadCsv, fetchAllTransactions } from "../export";
import type { TransactionsQuery } from "../schemas";

interface ExportButtonProps {
  customerId: string;
  query: TransactionsQuery;
  range: DayRange;
  disabled?: boolean;
}

export function ExportButton({
  customerId,
  query,
  range,
  disabled,
}: ExportButtonProps) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  const busy = state === "busy";
  const controller = useRef<AbortController>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function exportCsv() {
    if (busy) return;
    controller.current = new AbortController();
    const { signal } = controller.current;
    setState("busy");
    try {
      const transactions = await fetchAllTransactions(
        customerId,
        query,
        signal,
      );
      downloadCsv(
        transactions,
        `transactions-${range.start}-to-${range.end}.csv`,
      );
      setState("idle");
    } catch {
      if (!signal.aborted) setState("failed");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        type="button"
        onClick={exportCsv}
        disabled={disabled}
        // Not `disabled` while busy, which would drop keyboard focus.
        aria-disabled={busy || undefined}
        aria-label="Export CSV"
        className="flex size-11 items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-navy bg-card text-sm font-bold disabled:border-border disabled:text-muted-foreground aria-disabled:cursor-progress sm:w-auto sm:px-4"
      >
        {busy ? (
          <LoaderCircle
            aria-hidden
            className="size-4 animate-spin motion-reduce:animate-none"
          />
        ) : (
          <Download aria-hidden className="size-4" />
        )}
        <span aria-hidden className="hidden sm:inline">
          {busy ? "Exporting…" : "Export CSV"}
        </span>
      </Button>
      <p
        role="status"
        className="text-right text-[13px] font-semibold text-destructive"
      >
        {state === "failed" && "Export failed. Try again."}
        {busy && <span className="sr-only">Exporting transactions</span>}
      </p>
    </div>
  );
}
