export type SearchParams = Record<string, string | string[] | undefined>;

export type ParamSource = URLSearchParams | SearchParams;

export function readSearchParam(
  source: ParamSource,
  key: string,
): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}
