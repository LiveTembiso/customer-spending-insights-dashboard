import { apiGet, customerPath } from "@/lib/api/client";

import { toCsv } from "./csv";
import {
  type Transaction,
  type TransactionsQuery,
  transactionsResponseSchema,
} from "./schemas";

const BATCH_SIZE = 100;

/** Every transaction matching `query`, across all pages. Browser only. */
export async function fetchAllTransactions(
  customerId: string,
  query: TransactionsQuery,
  signal?: AbortSignal,
): Promise<Transaction[]> {
  const all: Transaction[] = [];
  for (let offset = 0; ; offset += BATCH_SIZE) {
    const page = await apiGet(
      customerPath(customerId, "transactions"),
      transactionsResponseSchema,
      { query: { ...query, limit: BATCH_SIZE, offset }, signal },
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
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
