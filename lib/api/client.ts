import type { z } from "zod";

import { ApiError, apiErrorBodySchema } from "./errors";

export type QueryParams = Record<string, string | number | undefined>;

export function customerPath(customerId: string, path: string) {
  return `/api/customers/${encodeURIComponent(customerId)}/${path}`;
}

export function withQuery(path: string, query: QueryParams = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

interface GetOptions {
  query?: QueryParams;
  signal?: AbortSignal;
}

/**
 * GETs a same-origin API path and validates the response against `schema`,
 * so a contract change fails loudly here rather than deep in the UI.
 *
 * Browser only: paths are relative. Server code reads the repositories
 * directly instead of calling its own API over HTTP.
 */
export async function apiGet<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  { query, signal }: GetOptions = {},
): Promise<z.output<Schema>> {
  let response: Response;
  let body: unknown;
  try {
    response = await fetch(withQuery(path, query), {
      headers: { Accept: "application/json" },
      signal,
    });
    body = await response.json().catch((error: unknown) => {
      // A cancelled request can fail mid-body; that's an abort, not bad JSON.
      if (signal?.aborted) throw error;
      return undefined;
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, "network_error", "Couldn't reach the server.");
  }

  if (!response.ok) {
    const parsed = apiErrorBodySchema.safeParse(body);
    if (parsed.success) {
      const { code, message, issues } = parsed.data.error;
      throw new ApiError(response.status, code, message, issues);
    }
    throw new ApiError(
      response.status,
      "internal_error",
      `Request failed with status ${response.status}.`,
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      response.status,
      "invalid_response",
      "The server sent an unexpected response.",
    );
  }
  return parsed.data;
}
