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

## Docker

With Docker and Compose installed, run from a fresh clone:

```bash
docker compose up --build --wait
```

Open [http://localhost:3000](http://localhost:3000). If that port is already in use,
run `APP_PORT=3001 docker compose up --build --wait` and open port 3001 instead.
Stop the container with `docker compose down`.

The multi-stage Node 22 Alpine build installs locked dependencies with `npm ci`
and copies Next.js standalone output, static assets and public files into a
runtime image running as a non-root user. The image checks `/api/health`;
`/api/ready` also checks that the mock data source can serve the default customer.
Local environment files, dependencies and test output are excluded from the build
context.

Compose accepts the variables in `.env.example` from the shell or an optional
`.env` file. `NEXT_PUBLIC_DEFAULT_CUSTOMER_ID` is a build argument: rebuild the
image after changing it. `LOG_LEVEL`, `MOCK_DATA_SEED` and `MOCK_API_LATENCY_MS`
are runtime settings. `APP_PORT` controls the host port and defaults to 3000.

CI builds and scans the container for high/critical vulnerabilities, waits for
its health check, and runs Playwright against that production container.

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
test-utils/                     Shared test fixtures, providers and text helpers
e2e/                            Playwright tests
```

Tests sit next to the code they cover (`*.test.ts(x)`). Import boundaries are enforced by ESLint:

- `components/` and `lib/` can't import from `features/` or `app/`.
- `features/` can't import from `app/`.

Shared behavior lives with its owner: transaction limits and purchase links in
`features/transactions/`, goal presentation in `features/goals/status.ts`, and
cross-feature URL, date, period and validation helpers in `lib/`. Reuse those
modules before adding another local helper. Shared test setup belongs in
`test-utils/`; individual tests keep their scenario-specific values and expected
results explicit. Test helpers are excluded from application coverage.

Use the shadcn components in `components/ui/` for standard UI controls and
surfaces. Keep application-specific composition, such as `SectionCard`,
`SelectField` and `EmptyState`, in `components/`. Style navigation
links with `buttonVariants` to retain native link semantics. The transaction range picker
uses a two-month popover on desktop and bottom sheet on mobile, with month/year
selectors and changes applied only after confirmation; goal progress retains its pace
marker and announces the actual percentage when spending exceeds the budget.
