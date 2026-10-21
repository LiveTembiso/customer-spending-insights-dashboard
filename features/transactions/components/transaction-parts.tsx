import { CategoryDot } from "@/features/categories/components/category-dot";
import { formatRands } from "@/lib/format";
import { cn } from "@/lib/utils";

import { merchantInitials } from "../merchant";
import type { Transaction } from "../schemas";

export const debit = (amount: number) => `−${formatRands(amount)}`;

export function MerchantAvatar({
  transaction,
  className,
}: {
  transaction: Transaction;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-[8px] text-xs font-bold text-navy shadow-[inset_0_0_0_1px_rgba(14,27,44,0.25)] forced-color-adjust-none",
        className,
      )}
      style={{ backgroundColor: transaction.categoryColor }}
    >
      {merchantInitials(transaction.merchant)}
    </span>
  );
}

export function CategoryPill({
  transaction,
  className,
}: {
  transaction: Transaction;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[13px] font-semibold whitespace-nowrap",
        className,
      )}
    >
      <CategoryDot color={transaction.categoryColor} className="size-[9px]" />
      {transaction.category}
    </span>
  );
}
