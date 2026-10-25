import { EmptyState } from "@/components/empty-state";
import { Item } from "@/components/ui/item";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SectionCard } from "@/components/layout/section-card";
import { toDayKey } from "@/lib/dates";
import { formatDay } from "@/lib/format";

import { getCurrentRecentTransactions } from "../server/current";
import { CategoryPill, debit, MerchantAvatar } from "./transaction-parts";

const LIMIT = 5;

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
        <EmptyState message="No transactions yet." />
      ) : (
        <>
          <ul className="flex flex-col lg:hidden">
            {transactions.map((transaction) => (
              <Item
                render={<li />}
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
              </Item>
            ))}
          </ul>

          <Table
            containerProps={{ className: "hidden lg:block" }}
            aria-labelledby="recent-title"
            className="w-full border-collapse text-sm"
          >
            <TableHeader>
              <TableRow className="bg-muted text-left text-[13px] text-muted-foreground">
                <TableHead
                  scope="col"
                  className="rounded-l-lg px-3 py-2.5 font-semibold"
                >
                  Date
                </TableHead>
                <TableHead scope="col" className="px-3 py-2.5 font-semibold">
                  Merchant
                </TableHead>
                <TableHead scope="col" className="px-3 py-2.5 font-semibold">
                  Category
                </TableHead>
                <TableHead scope="col" className="px-3 py-2.5 font-semibold">
                  Description
                </TableHead>
                <TableHead
                  scope="col"
                  className="rounded-r-lg px-3 py-2.5 text-right font-semibold"
                >
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="tabular-nums">
              {transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="border-b border-background last:border-b-0"
                >
                  <TableCell className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDay(toDayKey(new Date(transaction.date)))}
                  </TableCell>
                  <TableCell className="px-3 py-3 font-bold">
                    <span className="inline-flex items-center gap-2.5">
                      <MerchantAvatar transaction={transaction} />
                      {transaction.merchant}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <CategoryPill transaction={transaction} />
                  </TableCell>
                  <TableCell className="px-3 py-3 text-muted-strong">
                    {transaction.description}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right font-bold whitespace-nowrap">
                    {debit(transaction.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </SectionCard>
  );
}
