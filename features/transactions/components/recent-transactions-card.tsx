import { SectionCard } from "@/components/layout/section-card";
import { CategoryDot } from "@/features/categories/components/category-dot";
import { toDayKey } from "@/lib/dates";
import { formatDay, formatRands } from "@/lib/format";

import { merchantInitials } from "../merchant";
import type { Transaction } from "../schemas";
import { getCurrentRecentTransactions } from "../server/current";

const LIMIT = 5;

const debit = (amount: number) => `−${formatRands(amount)}`;

function MerchantAvatar({ transaction }: { transaction: Transaction }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-xs font-bold text-navy"
      style={{ backgroundColor: transaction.categoryColor }}
    >
      {merchantInitials(transaction.merchant)}
    </span>
  );
}

function CategoryPill({ transaction }: { transaction: Transaction }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[13px] font-semibold">
      <CategoryDot color={transaction.categoryColor} className="size-[9px]" />
      {transaction.category}
    </span>
  );
}

export async function RecentTransactionsCard() {
  const response = await getCurrentRecentTransactions(LIMIT);
  if (!response) return null;

  const { transactions } = response;

  return (
    <SectionCard
      id="recent-title"
      title="Recent transactions"
      link={{
        href: "/transactions",
        label: "View all",
        context: "transactions",
      }}
    >
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No transactions yet.</p>
      ) : (
        <>
          <ul className="flex flex-col md:hidden">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center gap-3 border-t border-background py-3 first:border-t-0 first:pt-0"
              >
                <MerchantAvatar transaction={transaction} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-bold">
                    {transaction.merchant}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {transaction.category} ·{" "}
                    {formatDay(toDayKey(new Date(transaction.date)))}
                  </span>
                </div>
                <span className="font-bold tabular-nums">
                  {debit(transaction.amount)}
                </span>
              </li>
            ))}
          </ul>

          <table className="hidden w-full border-collapse text-sm md:table">
            <thead>
              <tr className="bg-muted text-left text-[13px] text-muted-foreground">
                <th
                  scope="col"
                  className="rounded-l-lg px-3 py-2.5 font-semibold"
                >
                  Date
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Merchant
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Category
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Description
                </th>
                <th
                  scope="col"
                  className="rounded-r-lg px-3 py-2.5 text-right font-semibold"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-background last:border-b-0"
                >
                  <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDay(toDayKey(new Date(transaction.date)))}
                  </td>
                  <td className="px-3 py-3 font-bold">
                    <span className="inline-flex items-center gap-2.5">
                      <MerchantAvatar transaction={transaction} />
                      {transaction.merchant}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <CategoryPill transaction={transaction} />
                  </td>
                  <td className="px-3 py-3 text-muted-strong">
                    {transaction.description}
                  </td>
                  <td className="px-3 py-3 text-right font-bold whitespace-nowrap">
                    {debit(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </SectionCard>
  );
}
