# Customer Spending Insights Dashboard

A responsive dashboard that helps customers understand their spending: where the money goes, budget trends and what needs attention.

## Getting started

Requires Node 22 (see `.nvmrc`).

```bash
npm ci
cp .env.example .env   # optional, every variable has a default
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

The mock API follows the assessment contract under `/api/customers/{customerId}/`. With the dev server running:

- Interactive docs (Swagger UI): [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- OpenAPI 3.1 spec: [http://localhost:3000/api/openapi.json](http://localhost:3000/api/openapi.json)

The spec is generated from the same Zod schemas the routes validate with, so it can't drift from the implementation. The demo customer is `12345`.

## Scripts

| Command                 | What it does                      |
| ----------------------- | --------------------------------- |
| `npm run dev`           | Start the dev server              |
| `npm run build`         | Production build                  |
| `npm start`             | Serve the production build        |
| `npm run lint`          | ESLint                            |
| `npm run typecheck`     | TypeScript, no emit               |
| `npm run format:check`  | Prettier check                    |
| `npm test`              | Unit and component tests (Vitest) |
| `npm run test:coverage` | Unit tests with coverage          |
| `npm run test:e2e`      | End-to-end tests (Playwright)     |

## Project structure

Code is grouped by feature. Routes stay thin and compose features; shared code never depends on a feature.

```
app/
  (dashboard)/                  Pages sharing the app shell
    page.tsx                    Overview
    transactions/  goals/  insights/
  api/customers/[customerId]/   Mock API route handlers
features/
  <feature>/                    profile, spending, transactions, goals, categories
    components/                 UI for the feature
    hooks/                      Client data hooks (React Query)
    api.ts                      Typed client fetchers
    schemas.ts                  Zod schemas and types shared by client and server
    server/                     Data access used by route handlers (server-only)
components/
  ui/                           shadcn/ui primitives
  layout/                       App shell: sidebar, bottom nav, page header
lib/                            Cross-cutting helpers: env, logging, formatting
e2e/                            Playwright tests
```

Tests sit next to the code they cover (`*.test.ts(x)`). Import boundaries are enforced by ESLint:

- `components/` and `lib/` can't import from `features/` or `app/`.
- `features/` can't import from `app/`.
