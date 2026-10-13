import "server-only";

import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: z.string().trim().min(1).default("12345"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  MOCK_DATA_SEED: z.coerce.number().int().default(20240916),
  MOCK_API_LATENCY_MS: z.coerce.number().int().min(0).max(10_000).default(0),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  // Treat blank values (e.g. `LOG_LEVEL=`) as unset so defaults apply.
  const values = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== ""),
  );
  const result = envSchema.safeParse(values);

  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}

export const env = parseEnv({
  NEXT_PUBLIC_DEFAULT_CUSTOMER_ID: process.env.NEXT_PUBLIC_DEFAULT_CUSTOMER_ID,
  LOG_LEVEL: process.env.LOG_LEVEL,
  MOCK_DATA_SEED: process.env.MOCK_DATA_SEED,
  MOCK_API_LATENCY_MS: process.env.MOCK_API_LATENCY_MS,
});
