# AI Usage Documentation

This file documents how AI tools were used during the assessment.

The objective was not to blindly generate code, but to accelerate implementation while keeping architecture, technical decisions, and engineering ownership fully manual.

---

# Engineering Ownership

The following parts were designed and decided manually before implementation:

* global architecture choices
* monorepo structure
* backend/frontend separation
* Odoo integration strategy
* Docker and local environment setup
* project organization
* coding conventions
* error handling philosophy
* sync strategy
* feature decomposition
* specifications and definition of done
* commit strategy
* AI workflow rules
* reviewer experience considerations

The project structure, workflow, and implementation constraints were intentionally defined upfront before asking AI to generate code.

---

# How AI Was Used

AI tools were used as implementation assistants to:

* accelerate repetitive setup work
* generate first-pass implementations
* help structure boilerplate
* review architecture decisions
* explore Odoo JSON-RPC payloads
* improve documentation clarity
* identify edge cases
* review implementation trade-offs
* validate consistency with specifications

AI was always guided using explicit project rules, specifications, and implementation constraints.

---

# AI Constraints and Rules

Before implementation, project-specific rules and specifications were written manually to guide AI generation.

The AI was instructed to:

* avoid over-engineering
* keep architecture simple and reviewable
* isolate Odoo logic in a dedicated service layer
* keep route handlers thin
* preserve sync status visibility
* avoid hidden failures
* avoid hardcoded credentials
* prefer explicit naming
* produce small incremental changes
* follow the written specifications strictly

The AI was intentionally not asked to generate the entire project at once.

---

# Validation Process

All generated code was manually:

* reviewed
* validated
* adjusted when necessary
* tested locally
* compared against specifications

No code was accepted without understanding the implementation and validating that it matched the project requirements.

---

# Development Philosophy

The objective of using AI in this assessment was not to replace engineering thinking.

The objective was to:

* accelerate execution
* improve iteration speed
* reduce repetitive work
* focus more time on architecture and correctness
* preserve implementation quality and maintainability

AI was treated as a collaborative engineering assistant, not as an autonomous code generator.

---

# Ongoing Updates

This file may be updated during development to document:

* important AI-assisted implementation decisions
* architectural adjustments
* manual fixes applied after generation
* validation notes
* trade-offs identified during implementation

---

# 2026-05-11 — Feature 001 (client sync)

* Implemented Prisma `Client` model with `SyncStatus` enum, initial SQL migration (authored via `prisma migrate diff` because Docker was unavailable for `migrate dev` in this environment).
* Implemented Express `POST /clients` and `GET /clients`, thin routes, `clients.service` orchestration, and isolated Odoo JSON-RPC in `apps/api/src/services/odoo` (`OdooClient` + `createResPartner` for `res.partner`).
* On Odoo failure, local row is kept, `syncStatus` is `FAILED`, `syncError` is set, and `[ODOO_PARTNER_SYNC_FAILED]` is logged per spec.
* Next.js home page: simple create form, list with sync status and failed error text; initial list loaded in a server component to satisfy strict React lint rules; client refresh after create uses the browser `NEXT_PUBLIC_API_URL`.
* Aligned `@prisma/client` and `prisma` to **6.19.3** in `packages/database` and fixed `pnpm-workspace.yaml` `allowBuilds` placeholders so Prisma postinstall scripts run under pnpm 11.
* Root `pnpm dev` now builds the `database` package first so the API resolves the compiled workspace client.
* A later iteration added full-stack Docker services for `api` and `web` (see `specs/decisions/002-docker-full-stack.md` and `docker-compose.yml`).

---

# 2026-05-12 — Features 002–005 and Docker (batch)

* **002 Sale orders:** Added Prisma `Order`, `POST/GET /orders`, Odoo `product.product` find-or-create, `sale.order` + `sale.order.line` creation, `[ODOO_SALE_ORDER_SYNC_FAILED]` logging. Validation returns **400** when the client has no Odoo partner (no local order row).
* **003 Frontend flows:** Added `apps/web/src/lib/api.ts`, split components (`client-form`, `client-list`, `order-form`, `order-list`), and a single-page `Dashboard` with sections, loading copy, success banner, and client selector limited to **SYNCED** clients with a partner id.
* **004 Docker:** Added `docker/Dockerfile.api`, `docker/Dockerfile.web`, `docker/api-entrypoint.sh` (`prisma migrate deploy` then API), Compose services `api` and `web`, `app-db` healthcheck, `.dockerignore`, and `addons/.gitkeep` with `./addons:/mnt/extra-addons` for Odoo (removed empty `ai-workflow/` stub dirs and redundant `ai-workflow/README.md`).
* **005 Error handling:** Documented sync semantics in README; Odoo auth failures log `[ODOO_AUTH_FAILED]`; order/client sync failures keep local rows and persist `syncError`; `HttpError` separates validation **400** from sync **201** + `FAILED`.
* **Decisions:** Recorded ADR `specs/decisions/002-docker-full-stack.md` for the Compose approach.
* **Git:** Changes were committed in small conventional commits (database → API/lockfile → web → Docker → docs/AI).

---


# 2026-05-11 — Hosted deploy (Coolify) fixes (AI-assisted)

* **Symptom:** API logs showed only **`GET /clients`** / **`GET /orders`** (SSR from Next) and no **`POST`** when creating records from the public site; browser traffic was misrouted or blocked by CORS.
* **Cause:** `docker-compose.yml` could **override** **`NEXT_PUBLIC_API_URL`** with a localhost URL, so the browser never called the public API; separately, **`WEB_ORIGIN`** must be set on the **`api`** service for CORS on mutating requests.
* **Changes:** `NEXT_PUBLIC_API_URL` is driven by **environment + build args**; **`docker/Dockerfile.web`** uses **`next build`** / **`next start`** with **`ARG NEXT_PUBLIC_API_URL`**; API CORS accepts **comma-separated** **`WEB_ORIGIN`** and logs **`[CORS] allowed origins:`** at startup; **`apps/web/next.config.ts`** supports optional **`ALLOWED_DEV_ORIGINS`** for dev behind a custom host; **README** and **`.env.example`** document public API URL and CORS for production.

