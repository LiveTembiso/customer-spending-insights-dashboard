import { buildOpenApiSpec } from "../_openapi/spec";

// Deterministic, so Next prerenders it at build time.
export function GET() {
  return Response.json(buildOpenApiSpec());
}
