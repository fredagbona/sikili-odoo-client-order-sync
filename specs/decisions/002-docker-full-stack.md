# ADR 002 — Docker Compose for the full application stack

## Status

Accepted

## Context

The assessment requires a single-command local environment: web, API, app database, Odoo, and Odoo’s database, with `./addons` mounted for Odoo.

## Decision

Use **Docker Compose** with:

* **docker/Dockerfile.api** — multi-stage install of the pnpm workspace subset (`packages/database`, `apps/api`), `prisma migrate deploy` in an entrypoint, then `node apps/api/dist/index.js`.
* **docker/Dockerfile.web** — install only `apps/web` with pnpm, run `next dev` bound to `0.0.0.0:3000` for simplicity and fast iteration for reviewers.
* **Healthcheck** on `app-db` so `api` starts after Postgres accepts connections.
* **web** service sets `API_URL=http://api:4000` for server-side fetches while keeping `NEXT_PUBLIC_API_URL=http://localhost:4000` for the browser.

## Consequences

* Reviewers run `docker compose up --build` without installing Node locally (only Docker).
* Dev-mode Next.js in Docker is not production-optimized but is easy to reason about and matches the spec’s “`pnpm dev` or equivalent” wording.
* First Odoo database creation and module install remain manual steps documented in the README.
