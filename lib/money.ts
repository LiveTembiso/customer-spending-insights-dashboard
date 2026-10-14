// Amounts are kept in cents internally so sums never drift.
export type Cents = number;

export function toRands(cents: Cents): number {
  return cents / 100;
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return roundTo(((current - previous) / previous) * 100, 1);
}
