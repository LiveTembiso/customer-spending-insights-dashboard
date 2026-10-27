import { z } from "zod";

export type ServerErrorCode =
  "invalid_query" | "customer_not_found" | "internal_error";

export type ClientErrorCode =
  "invalid_response" | "network_error" | "unexpected_status";

export const apiErrorBodySchema = z.object({
  error: z.object({
    // Open-ended so a code added on the server doesn't break error parsing.
    code: z.string(),
    message: z.string(),
    issues: z
      .array(z.object({ path: z.string(), message: z.string() }))
      .optional(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ServerErrorCode | ClientErrorCode | (string & {}),
    message: string,
    readonly issues?: ApiErrorBody["error"]["issues"],
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Only server failures and dropped connections can succeed on retry. */
  get isRetryable() {
    return this.status >= 500 || this.code === "network_error";
  }
}
