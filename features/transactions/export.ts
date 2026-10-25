import { apiGet, customerPath } from "@/lib/api/client";

import { MAX_PAGE_SIZE } from "./constants";
import { toCsv } from "./csv";
import {
  type Transaction,
  type TransactionsQuery,
  transactionsResponseSchema,
} from "./schemas";

/** Every transaction matching `query`, across all pages. Browser only. */
export async function fetchAllTransactions(
  customerId: string,
  query: TransactionsQuery,
  signal?: AbortSignal,
): Promise<Transaction[]> {
  const all: Transaction[] = [];
  for (let offset = 0; ; offset += MAX_PAGE_SIZE) {
    const page = await apiGet(
      customerPath(customerId, "transactions"),
      transactionsResponseSchema,
      { query: { ...query, limit: MAX_PAGE_SIZE, offset }, signal },
    );
    all.push(...page.transactions);
    if (!page.pagination.hasMore || page.transactions.length === 0) {
      return all;
    }
  }
}

export function downloadCsv(
  transactions: readonly Transaction[],
  name: string,
) {
  // The byte order mark tells Excel the file is UTF-8.
  const blob = new Blob(["\uFEFF", toCsv(transactions)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Safari can still be reading the file just after the click.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
