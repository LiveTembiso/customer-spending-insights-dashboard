import { globSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildOpenApiSpec, ENDPOINTS } from "./spec";

const customerRoutesDir = path.resolve(
  import.meta.dirname,
  "../customers/[customerId]",
);

function routesOnDisk() {
  return globSync("**/route.ts", { cwd: customerRoutesDir })
    .map((file) => `/${path.dirname(file).split(path.sep).join("/")}`)
    .sort();
}

describe("OpenAPI spec", () => {
  const spec = buildOpenApiSpec();

  it("documents every customer route, and only those", () => {
    expect(ENDPOINTS.map((endpoint) => endpoint.path).sort()).toEqual(
      routesOnDisk(),
    );
  });

  it("has a 200 response schema for every operation", () => {
    for (const [route, item] of Object.entries(spec.paths)) {
      const { responses } = (item as { get: { responses: object } }).get;
      expect(responses, route).toHaveProperty("200");
    }
  });

  it("resolves every component reference", () => {
    const refs = JSON.stringify(spec).match(/#\/components\/[^"]+/g) ?? [];

    for (const ref of new Set(refs)) {
      const [, , group, name] = ref.split("/");
      const components = spec.components as Record<string, object>;
      expect(components[group], ref).toHaveProperty(name);
    }
  });

  it("documents query parameters with their contract defaults", () => {
    const transactions = spec.paths[
      "/api/customers/{customerId}/transactions"
    ] as {
      get: { parameters: { name?: string; schema?: { default?: unknown } }[] };
    };
    const limit = transactions.get.parameters.find((p) => p.name === "limit");

    expect(limit?.schema?.default).toBe(20);
  });
});
