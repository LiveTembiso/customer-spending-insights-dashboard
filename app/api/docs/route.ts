import { createHash } from "node:crypto";

// Swagger UI from a pinned CDN version, checked with subresource integrity.
const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14";

const init = `SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger-ui" });`;
const initHash = createHash("sha256").update(init).digest("base64");

const contentSecurityPolicy = [
  "default-src 'none'",
  `script-src https://cdn.jsdelivr.net 'sha256-${initHash}'`,
  "style-src https://cdn.jsdelivr.net 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Customer Spending Insights API</title>
    <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css"
      integrity="sha384-wxLW6kwyHktdDGr6Pv1zgm/VGJh99lfUbzSn6HNHBENZlCN7W602k9VkGdxuFvPn"
      crossorigin="anonymous">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI}/swagger-ui-bundle.js"
      integrity="sha384-wmyclcVGX/WhUkdkATwhaK1X1JtiNrr2EoYJ+diV3vj4v6OC5yCeSu+yW13SYJep"
      crossorigin="anonymous"></script>
    <script>${init}</script>
  </body>
</html>`;

export function GET() {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": contentSecurityPolicy,
    },
  });
}
