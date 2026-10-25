export function axisMax(largest: number): number {
  if (largest <= 0) return 1000;
  const step = 10 ** Math.floor(Math.log10(largest));
  for (const multiple of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (largest <= multiple * step) return multiple * step;
  }
  return 10 * step;
}
