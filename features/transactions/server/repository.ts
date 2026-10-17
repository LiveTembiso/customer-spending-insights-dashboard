import "server-only";

import { getCategory } from "@/features/categories/catalogue";
import { toRands } from "@/lib/money";

import type {
  SortBy,
  Transaction,
  TransactionsQuery,
  TransactionsResponse,
} from "../schemas";
import type { TransactionRecord } from "./generate";
import { getCustomerTransactions } from "./store";

const comparators: Record<
  SortBy,
  (a: TransactionRecord, b: TransactionRecord) => number
> = {
  date_desc: (a, b) => b.timestamp - a.timestamp,
  date_asc: (a, b) => a.timestamp - b.timestamp,
  amount_desc: (a, b) => b.amount - a.amount || b.timestamp - a.timestamp,
  amount_asc: (a, b) => a.amount - b.amount || b.timestamp - a.timestamp,
};

export function toTransaction(record: TransactionRecord): Transaction {
  const category = getCategory(record.category);

  return {
    id: record.id,
    date: new Date(record.timestamp).toISOString().replace(".000Z", "Z"),
    merchant: record.merchant,
    category: record.category,
    amount: toRands(record.amount),
    description: record.description,
    paymentMethod: record.paymentMethod,
    icon: category.icon,
    categoryColor: category.color,
  };
}

export function listTransactions(
  customerId: string,
  query: TransactionsQuery,
  now: Date,
): TransactionsResponse | undefined {
  const records = getCustomerTransactions(customerId, now);
  if (!records) return undefined;

  const search = query.q?.toLowerCase();
  const matches = records.filter(
    (record) =>
      (!query.category || record.category === query.category) &&
      (!query.startDate || record.day >= query.startDate) &&
      (!query.endDate || record.day <= query.endDate) &&
      (!search ||
        record.merchant.toLowerCase().includes(search) ||
        record.description.toLowerCase().includes(search)),
  );

  const page = matches
    .sort(comparators[query.sortBy])
    .slice(query.offset, query.offset + query.limit);

  return {
    transactions: page.map(toTransaction),
    pagination: {
      total: matches.length,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + page.length < matches.length,
    },
  };
}
