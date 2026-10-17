import { z } from "zod";

import { filtersResponseSchema } from "@/features/categories/schemas";
import { goalsResponseSchema } from "@/features/goals/schemas";
import { profileResponseSchema } from "@/features/profile/schemas";
import {
  categoriesQuerySchema,
  categoriesResponseSchema,
  summaryQuerySchema,
  summaryResponseSchema,
  trendsQuerySchema,
  trendsResponseSchema,
} from "@/features/spending/schemas";
import {
  transactionsQuerySchema,
  transactionsResponseSchema,
} from "@/features/transactions/schemas";
import { apiErrorBodySchema } from "@/lib/api/errors";

type JsonSchema = Record<string, unknown>;

interface Endpoint {
  path: string;
  operationId: string;
  tag: string;
  summary: string;
  description?: string;
  response: { name: string; schema: z.ZodType };
  query?: z.ZodType;
  /** Notes on query parameters that JSON Schema can't express. */
  parameterNotes?: Record<string, string>;
}

const CUSTOMER_PREFIX = "/api/customers/{customerId}";

export const ENDPOINTS: readonly Endpoint[] = [
  {
    path: "/profile",
    operationId: "getProfile",
    tag: "Profile",
    summary: "Customer profile",
    description: "Includes the customer's total spend since they joined.",
    response: { name: "ProfileResponse", schema: profileResponseSchema },
  },
  {
    path: "/spending/summary",
    operationId: "getSpendingSummary",
    tag: "Spending",
    summary: "Spending summary for a period",
    description:
      "Totals for the period ending today, compared with the period of the same length before it. " +
      "`topCategory` is null when nothing was spent, and a change is null when the previous period had nothing to compare with.",
    response: { name: "SummaryResponse", schema: summaryResponseSchema },
    query: summaryQuerySchema,
  },
  {
    path: "/spending/categories",
    operationId: "getSpendingByCategory",
    tag: "Spending",
    summary: "Spending by category",
    description:
      "Every category, largest first. A custom date range overrides `period`.",
    response: { name: "CategoriesResponse", schema: categoriesResponseSchema },
    query: categoriesQuerySchema,
    parameterNotes: {
      period: "Ignored when a custom date range is given.",
      startDate:
        "Start of a custom range (inclusive). Must be sent together with `endDate`.",
      endDate:
        "End of a custom range (inclusive). Must not be before `startDate`.",
    },
  },
  {
    path: "/spending/trends",
    operationId: "getSpendingTrends",
    tag: "Spending",
    summary: "Monthly spending trends",
    description:
      "One entry per month, oldest first. The last entry is the current month to date.",
    response: { name: "TrendsResponse", schema: trendsResponseSchema },
    query: trendsQuerySchema,
  },
  {
    path: "/transactions",
    operationId: "listTransactions",
    tag: "Transactions",
    summary: "List transactions",
    description: "Filterable, sortable and paginated.",
    response: {
      name: "TransactionsResponse",
      schema: transactionsResponseSchema,
    },
    query: transactionsQuerySchema,
    parameterNotes: {
      startDate: "Inclusive. Days are counted in South African time (UTC+2).",
      endDate: "Inclusive. Must not be before `startDate`.",
      q: "Case-insensitive search of merchant and description. An addition to the original contract.",
    },
  },
  {
    path: "/goals",
    operationId: "listGoals",
    tag: "Goals",
    summary: "Monthly budget goals",
    description:
      "Progress against each budget for the current month. Status is `warning` at 90% used, " +
      "or when spending is more than 10 points ahead of how far through the month it is.",
    response: { name: "GoalsResponse", schema: goalsResponseSchema },
  },
  {
    path: "/filters",
    operationId: "getFilters",
    tag: "Filters",
    summary: "Filter options",
    description: "Categories and date range presets for building filter UI.",
    response: { name: "FiltersResponse", schema: filtersResponseSchema },
  },
];

const UNSAFE_INTEGER_LIMIT = Number.MAX_SAFE_INTEGER;

// Zod spells out a long regex alongside `format: date` and safe-integer
// bounds on every integer; both are noise in the docs.
function tidy(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(tidy);
  if (typeof schema !== "object" || schema === null) return schema;

  const result: JsonSchema = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "$schema") continue;
    if (key === "pattern" && "format" in schema) continue;
    if (
      (key === "maximum" || key === "minimum") &&
      Math.abs(value as number) === UNSAFE_INTEGER_LIMIT
    ) {
      continue;
    }
    result[key] = tidy(value);
  }
  return result;
}

function toSchema(schema: z.ZodType, io: "input" | "output"): JsonSchema {
  return tidy(
    z.toJSONSchema(schema, { io, unrepresentable: "any" }),
  ) as JsonSchema;
}

function queryParameters(endpoint: Endpoint) {
  if (!endpoint.query) return [];
  const { properties = {} } = toSchema(endpoint.query, "input") as {
    properties?: Record<string, JsonSchema>;
  };

  return Object.entries(properties).map(([name, schema]) => ({
    name,
    in: "query",
    required: false,
    schema,
    ...(endpoint.parameterNotes?.[name] && {
      description: endpoint.parameterNotes[name],
    }),
  }));
}

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
  },
});

const healthResponse = (status: string) => ({
  type: "object",
  properties: { status: { const: status } },
  required: ["status"],
});

export function buildOpenApiSpec() {
  const paths: Record<string, unknown> = {};
  const schemas: Record<string, JsonSchema> = {
    ApiError: toSchema(apiErrorBodySchema, "output"),
  };

  for (const endpoint of ENDPOINTS) {
    schemas[endpoint.response.name] = toSchema(
      endpoint.response.schema,
      "output",
    );

    paths[`${CUSTOMER_PREFIX}${endpoint.path}`] = {
      get: {
        operationId: endpoint.operationId,
        tags: [endpoint.tag],
        summary: endpoint.summary,
        description: endpoint.description,
        parameters: [
          { $ref: "#/components/parameters/CustomerId" },
          ...queryParameters(endpoint),
        ],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${endpoint.response.name}`,
                },
              },
            },
          },
          ...(endpoint.query && {
            400: errorResponse("Invalid or repeated query parameters"),
          }),
          404: errorResponse("Customer not found"),
          500: errorResponse("Unexpected server error"),
        },
      },
    };
  }

  paths["/api/health"] = {
    get: {
      operationId: "getHealth",
      tags: ["Health"],
      summary: "Liveness check",
      responses: {
        200: {
          description: "The server is up",
          content: {
            "application/json": {
              schema: {
                ...healthResponse("ok"),
                properties: {
                  status: { const: "ok" },
                  uptimeSeconds: { type: "integer", minimum: 0 },
                },
              },
            },
          },
        },
      },
    },
  };

  paths["/api/ready"] = {
    get: {
      operationId: "getReadiness",
      tags: ["Health"],
      summary: "Readiness check",
      responses: {
        200: {
          description: "Ready to serve requests",
          content: {
            "application/json": { schema: healthResponse("ready") },
          },
        },
        503: {
          description: "The data source isn't available",
          content: {
            "application/json": { schema: healthResponse("not_ready") },
          },
        },
      },
    },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "Customer Spending Insights API",
      version: "1.0.0",
      description:
        "Mock API serving a customer's spending data. Amounts are in ZAR, " +
        "and days and months are counted in South African time (UTC+2). " +
        "Every response sends `X-Request-Id`; send your own to trace a request.",
    },
    servers: [{ url: "/" }],
    // A mock API: requests aren't authenticated.
    security: [],
    tags: [
      { name: "Profile", description: "Who the customer is." },
      { name: "Spending", description: "Totals, categories and trends." },
      {
        name: "Transactions",
        description: "Individual card and debit order payments.",
      },
      { name: "Goals", description: "Monthly budgets per category." },
      { name: "Filters", description: "Options for building filter controls." },
      {
        name: "Health",
        description: "Probes for orchestrators and load balancers.",
      },
    ],
    paths,
    components: {
      schemas,
      parameters: {
        CustomerId: {
          name: "customerId",
          in: "path",
          required: true,
          schema: { type: "string" },
          example: "12345",
        },
      },
    },
  };
}
