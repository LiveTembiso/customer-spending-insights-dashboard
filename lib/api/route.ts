import "server-only";

import { z } from "zod";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

import type { ApiErrorBody, ServerErrorCode } from "./errors";

interface CustomerRouteContext {
  params: Promise<{ customerId: string }>;
}

interface HandlerArgs<Query> {
  customerId: string;
  query: Query;
  now: Date;
}

interface CustomerRouteOptions<Schema extends z.ZodType, Result> {
  /** Route pattern, logged instead of the URL so customer IDs stay out of logs. */
  route: string;
  query?: Schema;
  /** Returns `undefined` when the customer doesn't exist. */
  handler(args: HandlerArgs<z.output<Schema>>): Result | undefined;
}

// Customer data must never sit in a shared cache.
export const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" };

// Accept a caller's ID for tracing only if it's short and log-safe.
const REQUEST_ID_PATTERN = /^[\w.-]{1,64}$/;

export function getRequestId(request: Request): string {
  const header = request.headers.get("x-request-id");
  return header && REQUEST_ID_PATTERN.test(header)
    ? header
    : crypto.randomUUID();
}

function errorResponse(
  status: number,
  code: ServerErrorCode,
  message: string,
  requestId: string,
  issues?: ApiErrorBody["error"]["issues"],
) {
  const body: ApiErrorBody = { error: { code, message, issues } };
  return Response.json(body, {
    status,
    headers: { ...NO_STORE_HEADERS, "X-Request-Id": requestId },
  });
}

type Issues = NonNullable<ApiErrorBody["error"]["issues"]>;

// Empty values (`?limit=`) mean "not set"; otherwise coercion turns them into
// 0. Repeated keys are rejected rather than silently keeping one value.
function readQuery(
  url: URL,
): { values: Record<string, string> } | { issues: Issues } {
  const values: Record<string, string> = {};
  const issues: Issues = [];

  for (const [key, value] of url.searchParams) {
    if (value.trim() === "") continue;
    if (key in values) {
      issues.push({ path: key, message: "Expected a single value" });
    }
    values[key] = value;
  }

  return issues.length > 0 ? { issues } : { values };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a `/api/customers/{customerId}/…` GET handler with query validation,
 * a 404 for unknown customers, simulated latency, logging and error handling.
 */
export function customerRoute<Schema extends z.ZodType, Result>({
  route,
  query: querySchema,
  handler,
}: CustomerRouteOptions<Schema, Result>) {
  return async function GET(
    request: Request,
    context: CustomerRouteContext,
  ): Promise<Response> {
    const started = performance.now();
    const requestId = getRequestId(request);
    const log = logger.child({ requestId, method: request.method, route });

    const respond = (response: Response) => {
      log.info(
        {
          status: response.status,
          durationMs: Math.round(performance.now() - started),
        },
        "request completed",
      );
      return response;
    };

    try {
      const { customerId } = await context.params;
      const url = new URL(request.url);

      let query: z.output<Schema> = undefined as z.output<Schema>;
      if (querySchema) {
        const raw = readQuery(url);
        const parsed =
          "values" in raw ? querySchema.safeParse(raw.values) : undefined;
        if (!parsed?.success) {
          const issues =
            "issues" in raw
              ? raw.issues
              : parsed!.error.issues.map((issue) => ({
                  path: issue.path.join("."),
                  message: issue.message,
                }));
          return respond(
            errorResponse(
              400,
              "invalid_query",
              "Some query parameters are invalid.",
              requestId,
              issues,
            ),
          );
        }
        query = parsed.data;
      }

      if (env.MOCK_API_LATENCY_MS > 0) await delay(env.MOCK_API_LATENCY_MS);

      const result = handler({ customerId, query, now: new Date() });
      if (result === undefined) {
        return respond(
          errorResponse(
            404,
            "customer_not_found",
            "Customer not found.",
            requestId,
          ),
        );
      }

      return respond(
        Response.json(result, {
          headers: { ...NO_STORE_HEADERS, "X-Request-Id": requestId },
        }),
      );
    } catch (error) {
      log.error({ err: error }, "request failed");
      return respond(
        errorResponse(
          500,
          "internal_error",
          "Something went wrong.",
          requestId,
        ),
      );
    }
  };
}
