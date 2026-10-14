import "server-only";

import type { CategoryName } from "@/features/categories/schemas";

export type PaymentMethod = "Credit Card" | "Debit Card" | "Debit Order";

export interface Merchant {
  name: string;
  descriptions: readonly string[];
}

export interface DayContext {
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  dayOfMonth: number;
}

/** A kind of purchase that may happen on any given day. */
export interface Habit {
  category: CategoryName;
  merchants: readonly Merchant[];
  amount: readonly [min: number, max: number];
  hours: readonly [from: number, to: number];
  paymentMethods: readonly PaymentMethod[];
  chance(day: DayContext): number;
}

/** A fixed monthly payment, collected on the same day each month. */
export interface Recurring {
  category: CategoryName;
  merchant: string;
  description: string;
  dayOfMonth: number;
  amount: readonly [min: number, max: number];
  paymentMethod: PaymentMethod;
}

const isWeekday = ({ weekday }: DayContext) => weekday >= 1 && weekday <= 5;
const isFriOrSat = ({ weekday }: DayContext) => weekday === 5 || weekday === 6;
const isWeekend = ({ weekday }: DayContext) => weekday === 0 || weekday === 6;
const isPayWeek = ({ dayOfMonth }: DayContext) => dayOfMonth >= 25;

const CARDS = ["Credit Card", "Debit Card"] as const;

export const HABITS: readonly Habit[] = [
  {
    category: "Groceries",
    merchants: [
      { name: "Pick n Pay", descriptions: ["Weekly groceries"] },
      { name: "Checkers", descriptions: ["Weekly groceries"] },
      { name: "Woolworths Food", descriptions: ["Weekly groceries"] },
    ],
    amount: [650, 1650],
    hours: [8, 18],
    paymentMethods: CARDS,
    chance: (day) =>
      day.weekday === 6 ? 0.55 : day.weekday === 0 ? 0.25 : 0.04,
  },
  {
    category: "Groceries",
    merchants: [
      { name: "Checkers", descriptions: ["Top-up shop", "Bread and milk"] },
      { name: "Pick n Pay", descriptions: ["Top-up shop", "Bread and milk"] },
      { name: "Spar", descriptions: ["Top-up shop", "Snacks"] },
      { name: "Woolworths Food", descriptions: ["Dinner ingredients"] },
      { name: "Food Lover's Market", descriptions: ["Fresh produce"] },
    ],
    amount: [45, 280],
    hours: [7, 20],
    paymentMethods: CARDS,
    chance: () => 0.22,
  },
  {
    category: "Dining",
    merchants: [
      { name: "Vida e Caffè", descriptions: ["Coffee"] },
      { name: "Seattle Coffee Co.", descriptions: ["Coffee"] },
    ],
    amount: [32, 68],
    hours: [7, 10],
    paymentMethods: CARDS,
    chance: (day) => (isWeekday(day) ? 0.25 : 0.05),
  },
  {
    category: "Dining",
    merchants: [
      { name: "Kauai", descriptions: ["Lunch"] },
      { name: "Nando's", descriptions: ["Lunch"] },
      { name: "Mugg & Bean", descriptions: ["Lunch meeting"] },
      { name: "Steers", descriptions: ["Lunch"] },
    ],
    amount: [75, 190],
    hours: [11, 14],
    paymentMethods: CARDS,
    chance: (day) => (isWeekday(day) ? 0.12 : 0.03),
  },
  {
    category: "Dining",
    merchants: [
      { name: "Spur", descriptions: ["Family dinner", "Dinner with friends"] },
      { name: "Ocean Basket", descriptions: ["Dinner with friends"] },
      { name: "Tashas", descriptions: ["Brunch", "Date night"] },
      { name: "RocoMamas", descriptions: ["Dinner with friends"] },
      { name: "Col'Cacchio", descriptions: ["Date night"] },
    ],
    amount: [280, 780],
    hours: [12, 21],
    paymentMethods: ["Credit Card"],
    chance: (day) => (isFriOrSat(day) ? 0.3 : 0.05),
  },
  {
    category: "Dining",
    merchants: [
      { name: "Uber Eats", descriptions: ["Food delivery"] },
      { name: "Mr D", descriptions: ["Food delivery"] },
    ],
    amount: [140, 320],
    hours: [18, 22],
    paymentMethods: ["Credit Card"],
    chance: (day) => (day.weekday === 5 || day.weekday === 0 ? 0.18 : 0.08),
  },
  {
    category: "Transportation",
    merchants: [
      {
        name: "Uber",
        descriptions: ["Trip to Sandton", "Trip to Rosebank", "Ride home"],
      },
      { name: "Bolt", descriptions: ["Trip to Sandton", "Ride home"] },
    ],
    amount: [55, 210],
    hours: [7, 24],
    paymentMethods: ["Credit Card"],
    chance: (day) => (isFriOrSat(day) ? 0.3 : 0.13),
  },
  {
    category: "Transportation",
    merchants: [
      { name: "Engen", descriptions: ["Fuel"] },
      { name: "Shell", descriptions: ["Fuel"] },
      { name: "Sasol", descriptions: ["Fuel"] },
      { name: "BP", descriptions: ["Fuel"] },
    ],
    amount: [600, 1050],
    hours: [6, 19],
    paymentMethods: CARDS,
    chance: () => 0.09,
  },
  {
    category: "Transportation",
    merchants: [{ name: "Gautrain", descriptions: ["Gautrain trip"] }],
    amount: [45, 160],
    hours: [6, 19],
    paymentMethods: ["Debit Card"],
    chance: (day) => (isWeekday(day) ? 0.08 : 0),
  },
  {
    category: "Shopping",
    merchants: [
      { name: "Takealot", descriptions: ["Online order"] },
      { name: "Mr Price", descriptions: ["Clothing"] },
      { name: "Woolworths", descriptions: ["Clothing", "Homeware"] },
      { name: "Clicks", descriptions: ["Toiletries", "Pharmacy"] },
      { name: "Dis-Chem", descriptions: ["Toiletries", "Pharmacy"] },
      { name: "Superbalist", descriptions: ["Online order"] },
      { name: "Game", descriptions: ["Household items"] },
    ],
    amount: [120, 1400],
    hours: [9, 20],
    paymentMethods: CARDS,
    chance: (day) => (isPayWeek(day) ? 0.14 : 0.06),
  },
  {
    category: "Entertainment",
    merchants: [
      { name: "Ster-Kinekor", descriptions: ["Movie tickets"] },
      { name: "Nu Metro", descriptions: ["Movie tickets"] },
    ],
    amount: [110, 320],
    hours: [14, 21],
    paymentMethods: CARDS,
    chance: (day) => (isWeekend(day) ? 0.1 : 0.02),
  },
  {
    category: "Entertainment",
    merchants: [
      { name: "Computicket", descriptions: ["Event tickets"] },
      { name: "Quicket", descriptions: ["Concert tickets"] },
    ],
    amount: [250, 900],
    hours: [9, 22],
    paymentMethods: ["Credit Card"],
    chance: (day) => (isPayWeek(day) ? 0.025 : 0.008),
  },
  {
    category: "Utilities",
    merchants: [{ name: "City Power", descriptions: ["Prepaid electricity"] }],
    amount: [200, 500],
    hours: [7, 21],
    paymentMethods: ["Debit Card"],
    chance: () => 0.05,
  },
  {
    category: "Utilities",
    merchants: [{ name: "Vodacom", descriptions: ["Airtime", "Data bundle"] }],
    amount: [29, 150],
    hours: [7, 22],
    paymentMethods: ["Debit Card"],
    chance: () => 0.04,
  },
];

export const RECURRING: readonly Recurring[] = [
  {
    category: "Utilities",
    merchant: "Afrihost",
    description: "Fibre subscription",
    dayOfMonth: 1,
    amount: [599, 599],
    paymentMethod: "Debit Order",
  },
  {
    category: "Utilities",
    merchant: "Vodacom",
    description: "Contract",
    dayOfMonth: 3,
    amount: [449, 449],
    paymentMethod: "Debit Order",
  },
  {
    category: "Utilities",
    merchant: "City of Johannesburg",
    description: "Water and refuse",
    dayOfMonth: 7,
    amount: [780, 1150],
    paymentMethod: "Debit Order",
  },
  {
    category: "Entertainment",
    merchant: "Spotify",
    description: "Premium subscription",
    dayOfMonth: 8,
    amount: [69.99, 69.99],
    paymentMethod: "Credit Card",
  },
  {
    category: "Entertainment",
    merchant: "Netflix",
    description: "Monthly subscription",
    dayOfMonth: 15,
    amount: [199, 199],
    paymentMethod: "Debit Order",
  },
  {
    category: "Entertainment",
    merchant: "Showmax",
    description: "Monthly subscription",
    dayOfMonth: 21,
    amount: [99, 99],
    paymentMethod: "Debit Order",
  },
];

export const ANNUAL_INFLATION = 0.05;
