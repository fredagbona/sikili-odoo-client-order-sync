# Sikili Odoo Client & Sales Order Sync Assessment

Technical assessment for Sikili: a small full-stack application that syncs internal **clients** and **sale orders** with **Odoo 18** over JSON-RPC, with explicit **sync status** and errors.

---

## Goal

```text
Create a client in the web app
→ create a res.partner in Odoo
→ store the Odoo partner ID locally

Create a sale order for that client
→ create a sale.order in Odoo
→ link it to the correct Odoo partner
→ store the Odoo order ID locally
```

The focus is **reviewable architecture**, **working Odoo integration**, **visible sync state**, and **reproducible Docker setup**—not a large product.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Web | Next.js (App Router), TypeScript |
| API | Express 5, TypeScript |
| App DB | PostgreSQL + Prisma (`packages/database`) |
| ERP | Odoo 18 (Sales + Invoicing), JSON-RPC |
| Orchestration | Docker Compose |
| Package manager | pnpm workspaces |

---

## Repository map

Use this table to **navigate the repo** quickly:

| Path | Purpose |
| --- | --- |
| `apps/web/` | Next.js UI: dashboard, forms, lists (`src/app/`, `src/components/`, `src/lib/api.ts`). |
| `apps/api/` | Express API: `src/index.ts`, feature modules under `src/modules/`, Odoo under `src/services/odoo/`. |
| `packages/database/` | Prisma schema, migrations, compiled client export (`prisma/`, `src/index.ts`). |
| `packages/shared/` | Reserved for shared types/validation (minimal today). |
| `docker/` | `Dockerfile.api`, `Dockerfile.web`, `api-entrypoint.sh` (migrations + start). |
| `addons/` | Mounted into Odoo at `/mnt/extra-addons` (placeholder `.gitkeep` until you add custom modules). |
| `specs/` | Feature specs, ADRs, checklists, commit strategy (see [Documentation layout](#documentation-layout)). |
| `docs/` | Architecture overview, coding standards, Odoo notes, AI workflow guidance. |
| `ai-workflow/` | Assessment-required **AI usage** log (`AI_USAGE.md`). |
| `IMPLEMENTATION_NOTES.md` | **Author narrative**: how the work was approached, researched, and reviewed (summary also in README below). |
| `.cursor/rules.md` | Cursor / agent constraints used during implementation. |
| `docker-compose.yml` | Full stack: `web`, `api`, `app-db`, `odoo`, `odoo-db`. Odoo bind-mounts **`./addons`** → **`/mnt/extra-addons`**. |

### High-level tree

```text
sikili-odoo-sync-assessment/
  apps/
    api/                      # Express + Prisma + Odoo JSON-RPC
    web/                      # Next.js reviewer UI
  packages/
    database/                 # Prisma schema, migrations, DB client package
    shared/                   # Optional shared code
  docker/                     # Container build + API entrypoint
  addons/                     # Odoo extra-addons (see .gitkeep)
  docs/                       # Conventions, architecture, Odoo, workflow
  specs/                      # Features, ADRs, DoD, commit strategy
  ai-workflow/                # AI_USAGE.md
  docker-compose.yml
  .env.example
  IMPLEMENTATION_NOTES.md     # Detailed process write-up
  README.md                   # This file
```

---

## How to run the project

### Prerequisites

* **Docker** + Docker Compose (recommended path), **or**
* **Node 20+** and **pnpm** if you run the API/web on the host while databases run in Docker.

### Option A — Full stack with Docker (recommended)

1. **Clone and env**

   ```bash
   git clone <repository-url>
   cd sikili-odoo-sync-assessment
   cp .env.example .env
   ```

   For Compose, keep `DATABASE_URL` pointing at **`app-db`** and `ODOO_URL` at **`http://odoo:8069`** as in `.env.example`. The `web` service sets **`API_URL=http://api:4000`** for Next.js server-side fetches; the browser still uses **`NEXT_PUBLIC_API_URL=http://localhost:4000`**.

2. **Start all services**

   ```bash
   docker compose up --build
   ```

   | Service | Port | Role |
   | --- | ---: | --- |
   | `web` | 3000 | Next.js (`next dev` in container) |
   | `api` | 4000 | Express; runs `prisma migrate deploy` on startup |
   | `app-db` | 5433→5432 | PostgreSQL for the app |
   | `odoo` | 8069 | Odoo 18 (`./addons` → `/mnt/extra-addons`) |
   | `odoo-db` | (internal) | PostgreSQL for Odoo |

3. **Odoo first-time setup** (required before sync succeeds)

   * Open `http://localhost:8069`
   * Create database: **`sikili_assessment`**, login **`admin`** / **`admin`** (match `.env`)
   * Install **Sales** and **Invoicing**

4. **Smoke test**

   * Web: `http://localhost:3000` — create client → create order for a **SYNCED** client.
   * API: `http://localhost:4000/health`
   * Odoo: confirm **Contacts** and **Sales** records.

5. **Clean slate rerun**

   ```bash
   docker compose down -v
   docker compose up --build
   ```

   Recreate the Odoo database and modules (step 3).

### Option B — PNPM on host + Docker for Postgres / Odoo only

1. Start data layer: `docker compose up -d app-db odoo odoo-db`

2. Adjust **`.env`** for host networking, for example:

   * `DATABASE_URL=postgresql://app_user:app_password@127.0.0.1:5433/sikili_sync`
   * `ODOO_URL=http://127.0.0.1:8069`
   * `API_URL=http://127.0.0.1:4000`
   * `NEXT_PUBLIC_API_URL=http://127.0.0.1:4000`

3. **Migrations** (once DB is up):

   ```bash
   pnpm db:deploy
   ```

4. **Run API + web** (builds `database` first):

   ```bash
   pnpm dev
   ```

### Root scripts (reference)

| Script | Meaning |
| --- | --- |
| `pnpm dev` | Build `database`, then run `api` + `web` in parallel. |
| `pnpm dev:api` / `pnpm dev:web` | Run a single app. |
| `pnpm db:deploy` | Apply Prisma migrations (`migrate deploy`). |
| `pnpm db:migrate` | Interactive migrate dev (local schema work). |
| `pnpm db:generate` | Regenerate Prisma client. |
| `pnpm lint` | ESLint on `web`. |
| `pnpm typecheck` | `tsc --noEmit` for `api`, `database`, `web`. |

---

## Sync status behavior

Each **client** and **order** has `syncStatus` (`PENDING`, `SYNCED`, `FAILED`) and optional `syncError`.

* **SYNCED** — Odoo accepted the write; `odooPartnerId` / `odooOrderId` is stored.
* **FAILED** — Local row kept; `syncError` explains the failure; logs include `[ODOO_PARTNER_SYNC_FAILED]` or `[ODOO_SALE_ORDER_SYNC_FAILED]`; auth issues log `[ODOO_AUTH_FAILED]` (passwords are never logged).
* **PENDING** — Usually very short-lived in the synchronous flow.

**Validation vs sync:** Creating an order requires a client with an Odoo partner id. If not, the API returns **400** and **no order row** is created. An **HTTP 201** can still return `syncStatus: FAILED` if the local row was saved but Odoo rejected the sync—the UI must read `syncStatus`, not only the status code.

---

## Architecture overview

```text
Next.js Web App
  ↓ HTTP
Express API
  ↓
Local PostgreSQL (Prisma)
  ↓
Odoo service layer (apps/api/src/services/odoo)
  ↓ JSON-RPC
Odoo 18
```

The frontend **never** calls Odoo directly. Route handlers stay thin; Odoo logic lives under `apps/api/src/services/odoo/`.

---

## Local data model (Prisma)

**Client:** name, phone, email, `odooPartnerId`, `syncStatus`, `syncError`, timestamps.

**Order:** `clientId`, `productName`, `amount`, `odooOrderId`, `syncStatus`, `syncError`, timestamps; belongs to `Client`.

---

## Odoo models used

| Odoo model | Use |
| --- | --- |
| `res.partner` | Clients / customers |
| `product.product` | Find-or-create by name for order lines |
| `sale.order` | Sale order header, linked to partner |
| `sale.order.line` | Line with product, qty `1`, `price_unit` = amount |

Rationale detail: `docs/odoo/integration-notes.md`.

---

## My process (how I took this project)

The full narrative—including research, manual vs AI work, review checklist, trade-offs, and “what I’d improve next”—is in **[`IMPLEMENTATION_NOTES.md`](./IMPLEMENTATION_NOTES.md)** at the repository root. Below is a short summary of that process.

1. **Read the assessment** and split expectations into core delivery (sync flows), engineering rules (DB, isolation, Docker, no secrets in code), and reviewer experience (README, honesty, no over-engineering).
2. **Define architecture up front**: monorepo for one-clone reproducibility; separate `apps/web` and `apps/api`; Prisma package for schema/migrations; **all Odoo JSON-RPC** behind `apps/api/src/services/odoo`.
3. **Model Odoo explicitly**: `res.partner` for clients, `sale.order` + `sale.order.line` for orders, `product.product` via simple find-or-create by name (no full catalog UI).
4. **Sync strategy**: synchronous request path—local row first, then Odoo, then update `SYNCED` / `FAILED` + `syncError`; no background queue in scope.
5. **Errors**: distinguish **validation** (400, no invalid local rows) from **sync** (201 possible with `FAILED`, row kept). Never drop local data on Odoo failure.
6. **Specs before bulk coding**: `specs/features/` and `.cursor/rules.md` constrained changes; work landed in **small conventional commits** (`specs/commits/commit-strategy.md`).
7. **AI as assistant**: Cursor + specs + `docs/` conventions; incremental prompts; manual review against “explain every line” and “matches spec” (see `ai-workflow/AI_USAGE.md`).

---

## Documentation layout

These folders are **intentionally kept** and are the canonical place for deeper detail than this README:

| Location | Contents |
| --- | --- |
| **`docs/architecture/`** | `overview.md` — system diagram and principles. |
| **`docs/conventions/`** | `coding-standards.md` — naming, layering, logging expectations. |
| **`docs/odoo/`** | `integration-notes.md` — JSON-RPC choice and model mapping. |
| **`docs/workflow/`** | `ai-assisted-development.md` — how AI output is reviewed. |
| **`specs/README.md`** | Index to the spec set. |
| **`specs/features/`** | `001`–`005` feature specs (client sync, orders, UI, Docker, errors). |
| **`specs/decisions/`** | ADRs: `001-monorepo-architecture.md`, `002-docker-full-stack.md`. |
| **`specs/commits/`** | `commit-strategy.md` — conventional commits and suggested history. |
| **`specs/checklists/`** | `definition-of-done.md` — submission checklist. |
| **`ai-workflow/`** | `AI_USAGE.md` only — what AI was used for and what was validated manually. |
| **`IMPLEMENTATION_NOTES.md`** | Author process and trade-offs (summary above). |

An empty **`docs/api/`** placeholder was removed. **`ai-workflow/`** only keeps `AI_USAGE.md` (empty stub folders and a redundant README were removed). The **`addons/`** directory is kept with **`.gitkeep`** so `./addons:/mnt/extra-addons` works in Compose when you have no custom modules yet. API behavior is described here and in the feature specs.

---

## Expected reviewer flow

1. `docker compose up --build` (with `.env` from `.env.example`).
2. Complete Odoo database + Sales + Invoicing setup.
3. Open `http://localhost:3000` — create client → confirm `res.partner`.
4. Create sale order for a synced client → confirm `sale.order` and partner link in Odoo.
5. Inspect sync badges / errors in the UI and API logs for failure paths.

---

## Error handling (summary)

If Odoo is down or rejects a write: **persist** the local row, set **`FAILED`**, store **`syncError`**, **log** with context, **show** the message in the UI.

---

## Assumptions and simplifications

* No authentication.
* Minimal product handling (find/create by name only).
* No retry queue or background worker in v1.
* Next.js and API images run **`dev`** mode for simplicity and fast iteration.

---

## What I would improve with more time

Background retries, idempotency keys, reconciliation jobs, structured logging with request IDs, integration tests against Odoo, RBAC, production deploy/monitoring. See also **section 10** in `IMPLEMENTATION_NOTES.md`.

---

## AI usage

AI assisted implementation under explicit rules; decisions and validation notes are in:

```text
ai-workflow/AI_USAGE.md
```

---

## Deployment

A hosted demo is optional. The required artifact is this repository with a working **`docker compose up --build`** flow.
