# Cursor Rules — Sikili Odoo Sync Assessment

---

# Project Context

This project is a technical assessment for Sikili.

The goal is to build a small full-stack application that syncs clients and sale orders from a local web app to Odoo.

The reviewer values:

* working Odoo integration
* clean architecture
* clear separation of concerns
* local sync status tracking
* error handling
* simple Docker-based setup
* honest documentation
* no over-engineering

---

# Core Principles

1. Prioritize clarity over cleverness.
2. Keep the implementation simple and reviewable.
3. Do not over-engineer abstractions.
4. Keep Odoo integration isolated in `apps/api/src/services/odoo`.
5. Keep route handlers thin.
6. Persist local data before or during sync so failures are visible.
7. Never silently ignore sync errors.
8. Prefer explicit names over generic helpers.
9. Write code that a reviewer can understand quickly.
10. Do not hardcode credentials. Use environment variables.

---

# Architecture Rules

## API

The API should be organized by feature:

```text
apps/api/src/modules/clients
apps/api/src/modules/orders
```

Each module should contain:

* routes
* service
* validation if needed

Odoo-specific logic must live only in:

```text
apps/api/src/services/odoo
```

Routes must not call Odoo directly.

---

## Database

Use Prisma models for:

* Client
* Order

Each model must include:

* local ID
* Odoo ID reference
* sync status
* sync error
* timestamps

### Sync Statuses

```text
PENDING
SYNCED
FAILED
```

---

## Frontend

The frontend can stay simple.

UI quality matters less than:

* clear forms
* clear list views
* visible sync statuses
* visible error messages

Do not spend time on complex styling.

---

# Error Handling Rules

If Odoo sync fails:

* store the local record
* mark sync status as `FAILED`
* store the error message
* log the error clearly
* return a meaningful response to the frontend

Do not throw away local data.

---

# Odoo Rules

Use Odoo JSON-RPC.

Use:

* `res.partner` for clients
* `sale.order` for sale orders
* `product.product` for products used in sale order lines

Always justify these choices in the README.

---

# AI Assistance Rules

When using AI:

* ask for architecture review, not blind generation
* validate every generated code path
* document major AI-assisted decisions in `ai-workflow/AI_USAGE.md`
* do not commit code you cannot explain
* prefer small, reviewable changes

---

# Commit Rules

Use small commits.

Each commit should represent one logical change.

Do **not** add `Co-authored-by:`, `Made-with: Cursor`, or any other Cursor or AI attribution trailers to commit messages or PR descriptions unless the author explicitly asks for them.

Use conventional commit style:

```text
chore:
docs:
feat:
fix:
refactor:
test:
```

## Examples

```text
chore: initialize monorepo structure
docs: add architecture overview
feat: add client creation API
feat: sync clients to Odoo
fix: persist failed sync status
```

---

# Final Submission Rules

Before submission:

## 1. Run from a clean state

```bash
docker compose down -v
docker compose up --build
```

## 2. Test the full flow

```text
create client → visible in Odoo
create sale order → visible in Odoo
```

## 3. Review Documentation

* Review `README.md`
* Review AI usage documentation
* Ensure `.env.example` is complete
