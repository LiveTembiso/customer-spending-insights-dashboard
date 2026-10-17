import "server-only";

import type { CategoryName } from "@/features/categories/schemas";
import {
  addDays,
  dayOfMonth,
  dayOfWeek,
  daysBetween,
  type DayKey,
  startOfDay,
} from "@/lib/dates";
import type { Cents } from "@/lib/money";
import { createRandom, hashString, type Random } from "@/lib/random";

import {
  ANNUAL_INFLATION,
  HABITS,
  type PaymentMethod,
  RECURRING,
} from "./spending-model";

export interface TransactionRecord {
  id: string;
  /** Epoch milliseconds. */
  timestamp: number;
  day: DayKey;
  merchant: string;
  category: CategoryName;
  amount: Cents;
  description: string;
  paymentMethod: PaymentMethod;
}

interface GenerateOptions {
  seed: number;
  customerId: string;
  /** First day of history (inclusive). */
  from: DayKey;
  /** Last day of history (inclusive). */
  to: DayKey;
}

function randomCents(
  random: Random,
  [min, max]: readonly [number, number],
): Cents {
  return random.int(Math.round(min * 100), Math.round(max * 100));
}

function randomTime(
  random: Random,
  day: DayKey,
  [from, to]: readonly [number, number],
): number {
  const secondsIntoDay = random.int(from * 3600, to * 3600 - 1);
  return startOfDay(day).getTime() + secondsIntoDay * 1000;
}

/**
 * Generates one day of spending. Each day has its own random stream, so a
 * day's transactions never change as more history is generated after it.
 */
function generateDay(
  seed: number,
  customerId: string,
  day: DayKey,
  yearsSinceStart: number,
): TransactionRecord[] {
  const random = createRandom(`${seed}:${customerId}:${day}`);
  const context = { weekday: dayOfWeek(day), dayOfMonth: dayOfMonth(day) };
  const inflation = (1 + ANNUAL_INFLATION) ** yearsSinceStart;
  const drafts: Omit<TransactionRecord, "id">[] = [];

  for (const payment of RECURRING) {
    if (payment.dayOfMonth !== context.dayOfMonth) continue;
    drafts.push({
      // Debit orders normally run early in the morning.
      timestamp: randomTime(random, day, [5, 8]),
      day,
      merchant: payment.merchant,
      category: payment.category,
      amount: randomCents(random, payment.amount),
      description: payment.description,
      paymentMethod: payment.paymentMethod,
    });
  }

  for (const habit of HABITS) {
    if (!random.chance(habit.chance(context))) continue;
    const merchant = random.pick(habit.merchants);
    drafts.push({
      timestamp: randomTime(random, day, habit.hours),
      day,
      merchant: merchant.name,
      category: habit.category,
      amount: Math.round(randomCents(random, habit.amount) * inflation),
      description: random.pick(merchant.descriptions),
      paymentMethod: random.pick(habit.paymentMethods),
    });
  }

  return drafts.map((draft, index) => ({
    ...draft,
    id: `txn_${hashString(`${seed}:${customerId}:${day}:${index}`).toString(36)}`,
  }));
}

export function generateTransactions({
  seed,
  customerId,
  from,
  to,
}: GenerateOptions): TransactionRecord[] {
  const records: TransactionRecord[] = [];
  const totalDays = daysBetween(from, to);

  for (let offset = 0; offset < totalDays; offset++) {
    records.push(
      ...generateDay(seed, customerId, addDays(from, offset), offset / 365),
    );
  }

  return records.sort((a, b) => a.timestamp - b.timestamp);
}
