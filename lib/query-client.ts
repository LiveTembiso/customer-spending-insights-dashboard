import {
  isServer,
  type QueryClient as QueryClientType,
  QueryClient,
} from "@tanstack/react-query";

import { ApiError } from "./api/errors";

const MAX_RETRIES = 2;

export function makeQueryClient(): QueryClientType {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Above zero so data hydrated from the server isn't refetched on mount.
        staleTime: 60 * 1000,
        retry: (failureCount, error) =>
          (!(error instanceof ApiError) || error.isRetryable) &&
          failureCount < MAX_RETRIES,
      },
    },
  });
}

let browserQueryClient: QueryClientType | undefined;

/**
 * A fresh client per server request (so users never share a cache), and a
 * single client in the browser so it survives React suspending on first render.
 */
export function getQueryClient(): QueryClientType {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
