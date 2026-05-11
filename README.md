# Sikili Odoo Client & Sales Order Sync Assessment

Technical assessment for Sikili: build a small full-stack application that syncs internal clients and sale orders with Odoo.

---

# Goal

The application demonstrates the following flow:

```text
Create a client in the web app
→ create a res.partner in Odoo
→ store the Odoo partner ID locally

Create a sale order for that client
→ create a sale.order in Odoo
→ link it to the correct Odoo partner
→ store the Odoo order ID locally
```

The objective is not to build a large product.

The objective is to show:

* clean architecture
* working Odoo integration
* sync status tracking
* error handling
* reproducible local setup

---

# Tech Stack

## Application

* Frontend: Next.js
* Backend: Node.js / Express.js
* Language: TypeScript
* Local database: PostgreSQL
* ORM: Prisma
* Odoo integration: JSON-RPC API
* Runtime: Docker Compose

## Odoo

* Odoo 18
* PostgreSQL for Odoo
* Sales module
* Invoicing module

---

# Repository Structure

```text
sikili-odoo-sync-assessment/
  apps/
    api/                  # Express API
    web/                  # Next.js frontend

  packages/
    database/             # Prisma schema and generated client
    shared/               # Shared types and validation schemas

  addons/                 # Mounted into Odoo at /mnt/extra-addons

  docs/
    architecture/         # Architecture notes
    api/                  # API documentation
    odoo/                 # Odoo integration notes

  specs/
    features/             # Feature specs with definition of done
    decisions/            # Architecture decision records
    checklists/           # Quality and review checklists

  ai-workflow/            # AI usage documentation required by the assessment

  docker-compose.yml
  .env.example
  README.md
```

---

# Why a Monorepo?

I chose a monorepo because this is an assessment project where the reviewer needs to run the full stack locally with a single command.

The frontend and API are still separated into dedicated apps to keep clear technical boundaries, but keeping everything in one repository improves:

* reviewer experience
* local reproducibility
* environment consistency
* shared types and validation
* Docker Compose orchestration

In a real production setup, the frontend, backend, database, and Odoo service could be deployed independently.

For this assessment, the priority is local reproducibility and clarity.

---

# Architecture Overview

```text
Next.js Web App
  ↓ HTTP
Express API
  ↓
Local PostgreSQL Database
  ↓
Odoo Service Layer
  ↓ JSON-RPC
Odoo 18
```

The backend owns the synchronization logic.

The frontend never talks directly to Odoo.

All Odoo API calls are isolated in a dedicated service layer under:

```text
apps/api/src/services/odoo
```

This keeps route handlers simple and makes Odoo integration easier to test, debug, and replace.

---

# Local Data Model

Minimum expected local model:

## clients

Stores internal clients and their Odoo sync reference.

### Important fields

* name
* phone
* email
* odoo_partner_id
* sync_status
* sync_error

## orders

Stores internal sale orders and their Odoo sync reference.

### Important fields

* client_id
* product_name
* amount
* odoo_order_id
* sync_status
* sync_error

---

# Sync Status Strategy

Each entity stores its sync status locally.

Possible statuses:

```text
PENDING
SYNCED
FAILED
```

The goal is to avoid silent failures.

If an Odoo API call fails:

* the local record is kept
* the sync status is marked as FAILED
* the error message is stored
* the user sees a clear message
* logs include enough context to debug the issue

---

# Odoo Objects Used

## res.partner

Used to represent clients.

### Reason

`res.partner` is the standard Odoo model for contacts, customers, and partners.

Since the web app creates clients, this is the most natural mapping.

---

## sale.order

Used to represent sale orders.

### Reason

`sale.order` is the standard Odoo model for quotations and sales orders.

The created order is linked to the correct `res.partner`.

---

## product.product

Used or created when a sale order is created.

### Reason

Odoo sale order lines require a product reference.

For simplicity, this project can find or create a product by name when creating an order.

---

# How to Run Locally

## 1. Clone the repository

```bash
git clone <repository-url>
cd sikili-odoo-sync-assessment
```

## 2. Create environment file

```bash
cp .env.example .env
```

Adjust values only if needed. For **Docker Compose**, keep `DATABASE_URL` pointing at `app-db` and `ODOO_URL` at `http://odoo:8069` as in `.env.example`. The `web` service overrides `API_URL` to `http://api:4000` so Next.js can reach the API during server rendering inside the stack.

## 3. Start the full stack (recommended for reviewers)

```bash
docker compose up --build
```

This starts:

* **web** — Next.js on port **3000** (dev server inside the container)
* **api** — Express on port **4000** (runs `prisma migrate deploy` on startup, then the API)
* **app-db** — PostgreSQL for the app
* **odoo** — Odoo 18 on port **8069**
* **odoo-db** — PostgreSQL for Odoo

The `addons` directory is mounted at `/mnt/extra-addons` in Odoo.

## 4. Open the app

```text
Web app: http://localhost:3000
API: http://localhost:4000
Odoo: http://localhost:8069
```

## 5. Alternative: PNPM on the host + Docker for databases only

Useful when developing the API or web with hot reload on your machine:

1. Start databases and Odoo: `docker compose up -d app-db odoo odoo-db`
2. In `.env`, set `DATABASE_URL=postgresql://app_user:app_password@127.0.0.1:5433/sikili_sync`, `ODOO_URL=http://127.0.0.1:8069`, `API_URL` and `NEXT_PUBLIC_API_URL` to `http://127.0.0.1:4000`.
3. Apply migrations: `pnpm db:deploy`
4. Run apps: `pnpm dev`

---

# Sync status behavior

Each **client** and **order** has `syncStatus` (`PENDING`, `SYNCED`, or `FAILED`) and optional `syncError`.

* **SYNCED** — Odoo accepted the write; `odooPartnerId` / `odooOrderId` is stored.
* **FAILED** — The local row still exists; `syncError` explains what went wrong; API logs contain `[ODOO_PARTNER_SYNC_FAILED]` or `[ODOO_SALE_ORDER_SYNC_FAILED]`.
* **PENDING** — Short-lived in the current synchronous flow; usually moves to `SYNCED` or `FAILED` in the same request.

Creating a sale order requires the client to already have an **Odoo partner id**; otherwise the API returns **400** and **no order row** is created (validation error, not a sync failure).

Successful **HTTP 201** responses can still carry `syncStatus: FAILED` when the local row was created but Odoo rejected the sync—the UI must read `syncStatus`, not only the status code.

---

# Odoo Setup

When Odoo starts for the first time, create a database using the values from `.env`:

```text
Database: sikili_assessment
Email/Login: admin
Password: admin
```

Then install:

* Sales
* Invoicing

The backend will use these credentials to call Odoo through JSON-RPC:

```env
ODOO_URL=http://odoo:8069
ODOO_DB=sikili_assessment
ODOO_USERNAME=admin
ODOO_PASSWORD=admin
```

---

# Expected Reviewer Flow

1. Run the project with Docker Compose.
2. Open the web app.
3. Create a client.
4. Confirm that a `res.partner` exists in Odoo.
5. Create a sale order for that client.
6. Confirm that a `sale.order` exists in Odoo and is linked to the correct partner.
7. Check local sync status and logs.

---

# Error Handling

The application should never silently fail.

If Odoo is unavailable or rejects a request:

* the local record is persisted
* the sync status is marked as FAILED
* a clear error is logged
* the UI displays a meaningful error message

---

# Assumptions and Simplifications

This assessment intentionally keeps the UI simple.

## Main simplifications

* no authentication layer
* minimal product management
* basic sale order creation
* no retry queue in the first version
* no complex Odoo customization unless needed

These choices are intentional to keep the assessment focused on the requested flow: client and sale order sync with Odoo.

---

# What I Would Improve With More Time

With more time, I would add:

* background job queue for retries
* idempotency keys for safer sync
* automatic reconciliation between local DB and Odoo
* better product catalog synchronization
* structured logging with request IDs
* integration tests against a test Odoo instance
* role-based access control
* production deployment with monitoring and alerts

---

# AI Usage

AI tools were used during this assessment.

The goal was not to blindly generate code, but to:

* speed up exploration
* validate implementation choices
* improve documentation
* brainstorm edge cases
* structure specifications

Details are documented in:

```text
ai-workflow/AI_USAGE.md
```

This file includes:

* what AI was used for
* what decisions were made manually
* how generated suggestions were reviewed
* what was validated through testing

---

# Deployment

A deployed version may be provided if available.

The required deliverable remains the repository with a working Docker Compose setup.
