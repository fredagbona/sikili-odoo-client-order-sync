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

## README contents (assessment checklist)

This README **explicitly** includes everything typically required for submission review:

1. [How to run the project locally](#how-to-run-the-project-locally)
2. [How to connect to Odoo](#how-to-connect-to-odoo)
3. [Odoo objects used and why](#odoo-objects-used-and-why)
4. [Assumptions and simplifications](#assumptions-and-simplifications)
5. [What I would improve with more time](#what-i-would-improve-with-more-time)
6. [Hosted deployment (fredthedev.com)](#hosted-deployment-fredthedevcom)
7. [Assessment compliance map](#assessment-compliance-map)

---

## Assessment compliance map

Quick map from the **Sikili brief** to this repository (physical DB columns for Odoo IDs are `odoo_partner_id` / `odoo_order_id`; Prisma and JSON still use `odooPartnerId` / `odooOrderId`).

| Brief item | Where |
| --- | --- |
| Web: create client (name, phone, email), list clients | `apps/web/src/components/client-form.tsx`, `client-list.tsx`, `apps/web/src/app/page.tsx` |
| Web: create sale order (product name, amount) for a client | `apps/web/src/components/order-form.tsx`, `order-list.tsx` |
| Browser → API | `apps/web/src/lib/api.ts` |
| Odoo JSON-RPC (no calls from routes) | `apps/api/src/services/odoo/` (`odoo.client.ts`, `odoo.partner.service.ts`, `odoo.sale-order.service.ts`, …) |
| HTTP routes (thin) + orchestration | `apps/api/src/modules/clients/`, `apps/api/src/modules/orders/` |
| Local relational model + sync status + Odoo IDs | `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/` |
| Env sample (no secrets in code) | `.env.example` |
| `docker compose up` stack + Odoo 18 + addons mount `./addons` → `/mnt/extra-addons` | `docker-compose.yml`, `addons/.gitkeep`, `docker/Dockerfile.api`, `docker/Dockerfile.web`, `docker/api-entrypoint.sh` |
| Run locally, connect to Odoo, objects + rationale, assumptions, improvements | This `README.md` (sections linked in [README contents](#readme-contents-assessment-checklist) above) |
| AI usage narrative + session captures | `ai-workflow/AI_USAGE.md`, `ai-workflow/screenshots/*.png` |

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
| `specs/` | Feature specs, ADRs, commit strategy (see [Documentation layout](#documentation-layout)). |
| `docs/` | Architecture overview, coding standards, Odoo notes, AI workflow guidance. |
| `ai-workflow/` | **AI usage** log (`AI_USAGE.md`) and **screenshots** of representative Cursor agent sessions (`screenshots/`). |
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
  specs/                      # Features, ADRs, commit strategy
  ai-workflow/
    AI_USAGE.md
    screenshots/            # Key Cursor agent exchanges (indexed under “AI usage” in README)
  docker-compose.yml
  .env.example
  IMPLEMENTATION_NOTES.md     # Detailed process write-up
  README.md                   # This file
```

---

## How to run the project locally

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

   For Compose, keep `DATABASE_URL` pointing at **`app-db`** and `ODOO_URL` at **`http://odoo:8069`** as in `.env.example`. The `web` service sets **`API_URL=http://api:4000`** for Next.js server-side fetches. The browser uses **`NEXT_PUBLIC_API_URL`** from your environment (defaults to **`http://127.0.0.1:4000`** for local port mapping). For a public deploy, set it to your **HTTPS API URL** and **rebuild** the `web` image so it is baked into the client bundle.

2. **Start all services**

   ```bash
   docker compose up --build
   ```

   | Service | Port | Role |
   | --- | ---: | --- |
   | `web` | 3000 | Next.js (`next build` + `next start` in container) |
   | `api` | 4000 | Express; runs `prisma migrate deploy` on startup |
   | `app-db` | 5433→5432 | PostgreSQL for the app |
   | `odoo` | 8069 | Odoo 18 (`./addons` → `/mnt/extra-addons`) |
   | `odoo-db` | (internal) | PostgreSQL for Odoo |

3. **Odoo first-time setup** (required before sync succeeds) — follow **[First-time Odoo setup](#first-time-odoo-setup)** under [How to connect to Odoo](#how-to-connect-to-odoo): create the database (name and **`admin`** / **`admin`** user to match `.env`), then install **Sales** and **Invoicing** using the Apps UI steps there.

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

## How to connect to Odoo

### Spin up an Odoo instance (this repo)

The easiest path is **Docker Compose** together with the rest of the stack (see [How to run the project locally](#how-to-run-the-project-locally)): the **`odoo`** service runs **Odoo 18** and **`odoo-db`** runs its PostgreSQL. No separate Odoo install is required for review.

### URL (reviewer browser)

| What | URL |
| --- | --- |
| Odoo web UI | **`http://localhost:8069`** |
| App web UI | **`http://localhost:3000`** |
| App API | **`http://localhost:4000`** |

From **inside Docker**, the API reaches Odoo at **`http://odoo:8069`** (see `ODOO_URL` in `.env.example`). From your **host machine** (e.g. browser or PNPM dev on the host), use **`http://127.0.0.1:8069`** once port `8069` is published.

### Credentials and database name (must match `.env`)

The API authenticates to Odoo over JSON-RPC using the variables below. **Create the Odoo database and admin user to match** so sync succeeds:

| Variable | Example value (`.env.example`) | Purpose |
| --- | --- | --- |
| `ODOO_URL` | `http://odoo:8069` (Compose) or `http://127.0.0.1:8069` (host API → Docker Odoo) | Base URL for JSON-RPC |
| `ODOO_DB` | **`sikili_assessment`** | Odoo **database name** you create in the UI |
| `ODOO_USERNAME` | **`admin`** | Odoo login |
| `ODOO_PASSWORD` | **`admin`** | Odoo password |

The Postgres **server** credentials for the `odoo-db` container (`ODOO_DB_HOST`, `ODOO_DB_USER`, etc.) are separate: they configure how the **Odoo container** talks to its DB, not the JSON-RPC login above.

### First-time Odoo setup

Use this after a **fresh** Odoo volume (for example right after `docker compose up` the first time, or after `docker compose down -v`). Same steps apply when you only run **`odoo`** + **`odoo-db`** for local development.

#### Create the database (match `.env`)

1. Open **`http://localhost:8069`** in your browser.
2. On the database manager screen, choose **Create database** (or equivalent).
3. Set **Database name** to **`sikili_assessment`** (must match **`ODOO_DB`** in `.env`).
4. Set **Email** (and login) and **Password** for the administrator to **`admin`** / **`admin`** (must match **`ODOO_USERNAME`** and **`ODOO_PASSWORD`** in `.env`).
5. Submit and wait until Odoo finishes provisioning and logs you in.

#### Install **Sales** and **Invoicing** (if not already installed)

These apps provide **customers / partners**, **quotations & sales orders**, and **customer invoices** used by this project’s JSON-RPC calls. On a brand-new database they are usually **not** installed until you add them from **Apps**.

1. **Open Apps** — from the main Odoo screen, open the **app switcher / main menu** (often top-left) and choose **Apps**. If you land on Discuss or another app first, use the menu to reach **Apps**.
2. **Search** — in the **Apps** screen, use the search bar at the top:
   * Type **`Sales`** and open the **Sales** application entry.
   * Click **Activate** or **Install** (wording depends on Odoo build). Wait until the installation finishes (progress may show briefly).
3. **Install Invoicing** — still under **Apps**, search for **`Invoicing`**:
   * Open the **Invoicing** application entry and click **Activate** or **Install**.
   * If you do not see an app named **Invoicing**, search **`Accounting`** and install the main accounting/invoicing application your Odoo edition lists (Community vs Enterprise labels differ; you need customer invoicing capabilities alongside **Sales**).
4. **Confirm** — in **Apps**, search again for **Sales** and **Invoicing** (or **Accounting**). Each should show as **Installed** / **Active**, not only “Available”.
5. **Optional check** — open the **Sales** app from the app menu: you should see menus such as **Orders** / **Quotations** without errors. Open **Contacts** (or **Customers**) to confirm partner features are available.

If **Sales** or **Invoicing** stay missing, ensure you are not filtering **Apps** to a subset that hides official apps (try **All** or clear filters), then use **Update Apps List** from the **Apps** menu (⋮ or **Actions**) if Odoo suggests refreshing the catalog.

Until the database exists and these apps are installed, the API may return **`FAILED`** sync statuses or model/access errors when calling Odoo.

### Using your own Odoo instead

Point **`ODOO_URL`**, **`ODOO_DB`**, **`ODOO_USERNAME`**, and **`ODOO_PASSWORD`** in `.env` at your instance. Ensure the database has **Sales** (and **Invoicing** if you rely on the same flows). The API only speaks **JSON-RPC** to the models documented below.

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

**Client:** name, phone, email, `odooPartnerId` (DB column **`odoo_partner_id`**), `syncStatus`, `syncError`, timestamps.

**Order:** `clientId`, `productName`, `amount`, `odooOrderId` (DB column **`odoo_order_id`**), `syncStatus`, `syncError`, timestamps; belongs to `Client`.

---

## Odoo objects used and why

The integration uses standard Odoo models so the behaviour matches what consultants and customers expect in Odoo, without custom modules in **`addons/`** (only **`.gitkeep`** is committed).

| Odoo object | Why this object |
| --- | --- |
| **`res.partner`** | Canonical model for **customers and contacts**. Creating a “client” in the app maps to a customer partner Odoo can reuse across sales, accounting, and CRM. |
| **`product.product`** | **Sale order lines must reference a product**. The app does not ship a catalog UI; it **searches by exact product name** and **creates** a simple sellable product if none exists, which is enough for the assessment flow. |
| **`sale.order`** | Standard model for **quotations / sales orders**. Header holds the **customer** (`partner_id`) so the order is visible under the correct partner in Odoo. |
| **`sale.order.line`** | Represents **what was sold**: one line with **quantity 1** and **`price_unit`** set to the amount entered in the app, plus a line description (`name`) aligned with the product label. |

Additional rationale and JSON-RPC context: **`docs/odoo/integration-notes.md`**.

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
| **`ai-workflow/`** | `AI_USAGE.md` — what AI was used for and what was validated manually; **`screenshots/`** — representative Cursor agent session captures (indexed in [AI usage](#ai-usage) in this README). |
| **`IMPLEMENTATION_NOTES.md`** | Author process and trade-offs (summary above). |

An empty **`docs/api/`** placeholder was removed. **`ai-workflow/`** contains **`AI_USAGE.md`** and **`screenshots/`** (session evidence for the assessment’s AI policy). The **`addons/`** directory is kept with **`.gitkeep`** so **`./addons:/mnt/extra-addons`** works in Compose when you have no custom modules yet. API behaviour is described here and in the feature specs.

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

* **No authentication** on the app API or web UI; the assessment scope is sync behaviour, not identity.
* **Single-tenant, local / demo** setup: one Odoo database name (`ODOO_DB`) and one set of API credentials; not multi-company or multi-warehouse.
* **Synchronous sync only**: each create request completes Odoo work in-line; there is **no job queue**, backoff, or scheduled retries.
* **Product model**: find-or-create **`product.product`** by **exact name**; no SKU, variants, taxes, pricelists, or stock integration.
* **Orders**: one **sale order line** per app order; quantity fixed to **1**; amount maps to **`price_unit`** on the line.
* **UI** is intentionally plain: forms and lists with **sync status** and errors visible; no design system or advanced state libraries.
* **Docker images** run a **production Next.js build** (`next build` / `next start` in `docker/Dockerfile.web`) and a **Node API** image suited to assessment review; TLS termination and extra hardening are left to your reverse proxy / PaaS.
* **`addons/`** is present with **`.gitkeep`** so **`./addons:/mnt/extra-addons`** satisfies Odoo extensibility expectations **without** shipping a custom Odoo module for this scope.

---

## What I would improve with more time

* **Retries and idempotency**: safe re-drive of failed syncs without duplicating Odoo records.
* **Background jobs**: queue Odoo calls so HTTP requests stay fast and transient Odoo outages hurt less.
* **Reconciliation**: periodic compare of local rows vs Odoo for drift detection.
* **Product domain**: proper catalog sync, SKUs, tax rules, and richer line payloads.
* **Observability**: structured logs with **request IDs**, metrics, and tracing.
* **Testing**: automated **integration tests** against Odoo (CI service or container).
* **Security**: authentication, RBAC, secret rotation, rate limiting on public APIs.
* **Operations**: production-grade images, health endpoints beyond `/health`, monitoring and alerts.

More detail on trade-offs and process: **`IMPLEMENTATION_NOTES.md`** (especially section 10).

---

## AI usage

AI assisted implementation under explicit rules; decisions and validation notes are in:

```text
ai-workflow/AI_USAGE.md
```

The assessment also asks for **evidence of how AI was used** (e.g. screenshots or exports). These **Cursor agent** captures are stored under **`ai-workflow/screenshots/`** and summarized below (same order as filenames).

| # | File | What it shows |
| --- | --- | --- |
| 1 | [`ai-workflow/screenshots/01-initial-codebase-review.png`](./ai-workflow/screenshots/01-initial-codebase-review.png) | Early **codebase review**: prompt to read the repo and explain project intent, structure, collaboration rules, and documentation—agent exploration and summary. |
| 2 | [`ai-workflow/screenshots/02-readme-structure-and-process.png`](./ai-workflow/screenshots/02-readme-structure-and-process.png) | **README / repo hygiene**: integrating `IMPLEMENTATION_NOTES.md`, improving run and navigation docs, pruning unused `docs/` / `specs/` paths—multi-step agent work with review. |
| 3 | [`ai-workflow/screenshots/03-odoo-sales-invoicing-readme.png`](./ai-workflow/screenshots/03-odoo-sales-invoicing-readme.png) | **Odoo reviewer setup**: expanding README with **Sales** and **Invoicing** install steps and cross-links so a reviewer can finish Odoo before testing sync. |

Open the linked files in the repo (or on GitHub) to view the full screenshots.

## Deployment

A hosted demo is optional. The required artifact is this repository with a working **`docker compose up --build`** flow.

### Hosted deployment (fredthedev.com)

This author runs the stack behind a reverse proxy (e.g. **Coolify**) on **`fredthedev.com`**. Public entry points:

| Service | URL | Notes |
| --- | --- | --- |
| **Web app** (Next.js) | [https://sikili.fredthedev.com](https://sikili.fredthedev.com) | Dashboard: create clients and orders; browser calls the **public API** below. |
| **App API** (Express) | [https://sikili-api.fredthedev.com](https://sikili-api.fredthedev.com) | [Health check](https://sikili-api.fredthedev.com/health), `GET/POST /clients`, `GET/POST /orders`. |
| **Odoo 18** | *Assign in your PaaS* | In Compose the API uses **`ODOO_URL=http://odoo:8069`** on the internal network. If you expose Odoo to the browser, give the `odoo` service its own HTTPS URL and open **Apps** / **Contacts** / **Sales** there as in [First-time Odoo setup](#first-time-odoo-setup). |

**Environment (high level)** — set these for the **same** Compose project so SSR, browser, and CORS line up:

| Variable | Where | Example (this deployment) |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | **`web` build args + runtime** | `https://sikili-api.fredthedev.com` |
| `API_URL` | **`web` only** (server-side fetch) | `http://api:4000` (Compose service name) |
| `WEB_ORIGIN` | **`api`** (CORS; required for browser `POST`) | `https://sikili.fredthedev.com` |
| `ODOO_URL` | **`api`** | `http://odoo:8069` |
| `DATABASE_URL` | **`api`** | `postgresql://…@app-db:5432/sikili_sync` |

After changing `NEXT_PUBLIC_API_URL`, **rebuild the `web` image** so the client bundle embeds the correct API origin. After changing `WEB_ORIGIN`, restart the **`api`** service and confirm logs show `[CORS] allowed origins:` including your web URL.

**Smoke test on the hosted URLs:** open the [web app](https://sikili.fredthedev.com) → create a client → confirm **SYNCED** (or read the error text) → create an order for that client. Use the [API health](https://sikili-api.fredthedev.com/health) endpoint if the API should be checked independently.
