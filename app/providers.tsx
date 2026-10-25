"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

import { getQueryClient } from "@/lib/query-client";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
      {process.env.NODE_ENV === "development" && (
        <div className="fixed right-3 bottom-24 z-50 md:bottom-3">
          <ReactQueryDevtools buttonPosition="relative" />
        </div>
      )}
    </QueryClientProvider>
  );
}
