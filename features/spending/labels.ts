import { formatMonthShort } from "@/lib/format";

export const purchases = (count: number) =>
  count === 1 ? "1 purchase" : `${count} purchases`;

export const transactions = (count: number) =>
  count === 1 ? "1 transaction" : `${count} transactions`;

/** "Oct 2026" */
export const monthYear = (month: string) =>
  `${formatMonthShort(month)} ${month.slice(0, 4)}`;
