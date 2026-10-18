import { WalletMinimal } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 font-extrabold", className)}>
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-sidebar-primary text-white">
        <WalletMinimal aria-hidden className="size-5" />
      </span>
      <span className="text-[17px] leading-tight tracking-tight">
        Spending Insights
      </span>
    </span>
  );
}
