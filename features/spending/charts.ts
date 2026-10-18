export function axisMax(largest: number): number {
  if (largest <= 0) return 1000;
  const step = 10 ** Math.floor(Math.log10(largest));
  for (const multiple of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (largest <= multiple * step) return multiple * step;
  }
  return 10 * step;
}

interface Slice {
  color: string;
  amount: number;
}

const GAP = 0.4;

export function donutGradient(slices: readonly Slice[]): string {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  if (total === 0) return "conic-gradient(var(--muted) 0 100%)";

  const stops: string[] = [];
  let start = 0;
  for (const slice of slices) {
    if (slice.amount <= 0) continue;
    const end = start + (slice.amount / total) * 100;
    const visibleEnd = Math.max(start, end - GAP);
    stops.push(
      `${slice.color} ${round(start)}% ${round(visibleEnd)}%`,
      `#ffffff ${round(visibleEnd)}% ${round(end)}%`,
    );
    start = end;
  }
  return `conic-gradient(${stops.join(", ")})`;
}

const round = (value: number) => Math.round(value * 100) / 100;
