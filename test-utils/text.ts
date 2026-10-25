/** Normalize the no-break spaces used in en-ZA amounts for text assertions. */
export const normalizedText = (element: Element | null | undefined): string =>
  element?.textContent?.replace(/\s/g, " ") ?? "";
