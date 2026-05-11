# Feature 004 — Docker and Odoo Setup

---

# Goal

Provide a simple and reproducible local development environment that allows the reviewer to run the entire stack with a single command.

The reviewer should be able to:

```bash
docker compose up --build
```

and test the full flow locally.

The setup should include:

* frontend application
* backend API
* application PostgreSQL database
* Odoo instance
* PostgreSQL database for Odoo

The setup should prioritize clarity and reproducibility over production-grade infrastructure complexity.

---

# Scope

## Included

* Docker Compose setup
* Dockerfiles for frontend and backend
* Odoo container
* PostgreSQL containers
* mounted Odoo addons folder
* environment variable support
* local networking between services
* reviewer instructions in README

## Not Included

* Kubernetes
* production orchestration
* HTTPS
* reverse proxies
* load balancing
* advanced deployment infrastructure
* monitoring stack
* production secrets management

Keep the setup simple and easy to review.

---

# Expected Services

The final Docker Compose setup should contain:

```text
web         → Next.js frontend
api         → Express backend
app-db      → PostgreSQL for local app data
odoo        → Odoo 18
odoo-db     → PostgreSQL for Odoo
```

---

# Expected Reviewer Flow

The reviewer should be able to:

1. Clone the repository.
2. Copy `.env.example` to `.env`.
3. Run:

```bash
docker compose up --build
```

4. Open:

```text
Frontend → http://localhost:3000
API      → http://localhost:4000
Odoo     → http://localhost:8069
```

5. Create an Odoo database.
6. Install Sales and Invoicing modules.
7. Test the synchronization flow.

---

# Odoo Requirements

Use:

```text
Odoo 18
```

The Odoo service must:

* connect to its PostgreSQL database
* expose port `8069`
* mount the local `addons` folder into:

```text
/mnt/extra-addons
```

This is explicitly required by the assessment.

---

# Addons Folder Requirement

The repository must include:

```text
/addons
```

Even if no complex custom module is added.

Docker Compose must mount:

```text
./addons:/mnt/extra-addons
```

Reason:

The reviewer expects custom addons to be visible if needed.

---

# Environment Variables

Do not hardcode credentials.

Use `.env` variables.

Minimum required variables:

```env
NODE_ENV=development

API_PORT=4000
WEB_PORT=3000

DATABASE_URL=postgresql://app_user:app_password@app-db:5432/sikili_sync

ODOO_URL=http://odoo:8069
ODOO_DB=sikili_assessment
ODOO_USERNAME=admin
ODOO_PASSWORD=admin

ODOO_DB_HOST=odoo-db
ODOO_DB_PORT=5432
ODOO_DB_USER=odoo
ODOO_DB_PASSWORD=odoo

NEXT_PUBLIC_API_URL=http://localhost:4000
```

Provide a complete `.env.example`.

---

# Docker Compose Philosophy

The setup should:

* work reliably on reviewer machines
* remain easy to understand
* avoid unnecessary complexity
* avoid production optimizations
* prioritize reproducibility

Avoid:

* advanced networking
* custom orchestration
* unnecessary containers
* complex shell scripts

---

# Backend Container Requirements

The API container should:

* install dependencies
* run the Express API
* expose port `4000`
* connect to the local PostgreSQL database
* communicate with Odoo through Docker networking

Recommended command:

```text
pnpm dev
```

or equivalent.

---

# Frontend Container Requirements

The frontend container should:

* install dependencies
* run the Next.js app
* expose port `3000`
* use `NEXT_PUBLIC_API_URL`

Recommended command:

```text
pnpm dev
```

or equivalent.

---

# PostgreSQL Requirements

Two PostgreSQL databases are expected:

## Application Database

Used for:

* local clients
* local orders
* sync status tracking

## Odoo Database

Used internally by Odoo.

Keep them separate.

Reason:

This reflects real-world separation between business applications and ERP systems.

---

# Local Networking

Containers should communicate through service names.

Examples:

```text
api → app-db
api → odoo
odoo → odoo-db
```

Avoid hardcoded localhost references between containers.

---

# Odoo Initial Setup

When Odoo starts for the first time:

1. Open:

```text
http://localhost:8069
```

2. Create a database using:

```text
Database: sikili_assessment
Email/Login: admin
Password: admin
```

3. Install:

* Sales
* Invoicing

These steps must be documented in README.

---

# Data Persistence

Use Docker volumes for:

* application database
* Odoo database
* Odoo storage

Example:

```text
app_db_data
odoo_db_data
odoo_data
```

This prevents data loss between restarts.

---

# Minimal Docker Compose Structure

Recommended structure:

```text
services:
  web:
  api:
  app-db:
  odoo:
  odoo-db:

volumes:
  app_db_data:
  odoo_db_data:
  odoo_data:
```

Keep the file readable.

---

# README Requirements

README must explain:

* how to start the stack
* how to create the Odoo database
* which ports are exposed
* how to access the frontend
* how to access Odoo
* how to run the reviewer flow

The reviewer should not need to guess setup steps.

---

# Definition of Done

* [ ] Docker Compose starts successfully.
* [ ] Frontend is accessible.
* [ ] API is accessible.
* [ ] Odoo is accessible.
* [ ] Odoo connects to its PostgreSQL database.
* [ ] App API connects to its PostgreSQL database.
* [ ] `addons` folder is mounted at `/mnt/extra-addons`.
* [ ] `.env.example` exists and is complete.
* [ ] README explains Odoo setup clearly.
* [ ] Reviewer can run the project locally with minimal setup.

---

# Manual Test Plan

1. Stop all containers.
2. Run:

```bash
docker compose down -v
```

3. Rebuild from scratch:

```bash
docker compose up --build
```

4. Confirm all services start correctly.
5. Open frontend.
6. Open Odoo.
7. Create Odoo database.
8. Install Sales and Invoicing modules.
9. Test client sync.
10. Test sale order sync.
11. Confirm data persists after restart.

---

# Implementation Guidance for AI

When implementing this feature:

* keep Docker setup simple
* avoid production-level infrastructure
* avoid unnecessary containers
* avoid custom orchestration scripts
* prioritize reviewer experience
* prioritize reproducibility
* make service relationships explicit
* keep configuration readable
