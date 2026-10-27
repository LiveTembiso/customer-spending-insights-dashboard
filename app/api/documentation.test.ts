import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { GET as docs } from "./docs/route";
import { GET as openapi } from "./openapi.json/route";

describe("API documentation routes", () => {
  it("serves an HTML viewer pointing at the local schema and integrity-checked assets", async () => {
    const response = docs();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8",
    );
    const document = new DOMParser().parseFromString(
      await response.text(),
      "text/html",
    );
    expect(document.title).toBe("Customer Spending Insights API");
    expect(document.getElementById("swagger-ui")).not.toBeNull();
    expect(document.body.textContent).toContain('url: "/api/openapi.json"');
    const assets = [...document.querySelectorAll("script[src],link[href]")];
    expect(assets).toHaveLength(2);
    for (const asset of assets) {
      expect(asset.getAttribute("src") ?? asset.getAttribute("href")).toMatch(
        /^https:\/\/cdn\.jsdelivr\.net\/npm\/swagger-ui-dist@\d+\.\d+\.\d+\//,
      );
      expect(asset.getAttribute("integrity")).toMatch(
        /^sha384-[A-Za-z0-9+/]+={0,2}$/,
      );
      expect(asset.getAttribute("crossorigin")).toBe("anonymous");
    }
  });

  it("allows only the CDN assets and its own inline script", async () => {
    const response = docs();
    const policy = response.headers.get("Content-Security-Policy")!;
    const document = new DOMParser().parseFromString(
      await response.text(),
      "text/html",
    );
    const inline = document.querySelector("script:not([src])")!.textContent!;
    const hash = createHash("sha256").update(inline).digest("base64");

    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain(
      `script-src https://cdn.jsdelivr.net 'sha256-${hash}'`,
    );
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("serves the JSON contract consumed by the viewer with documented customer endpoints", async () => {
    const response = openapi();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    const spec = await response.json();
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.paths).toHaveProperty("/api/customers/{customerId}/profile");
    expect(spec.paths).toHaveProperty(
      "/api/customers/{customerId}/transactions",
    );
    expect(spec.paths).toHaveProperty(
      "/api/customers/{customerId}/spending/categories",
    );
    expect(spec.components.schemas).toBeDefined();
  });
});
