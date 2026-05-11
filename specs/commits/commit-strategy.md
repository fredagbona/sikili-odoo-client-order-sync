# Commit Strategy

---

The project should be developed through **small, reviewable commits**.

The goal is to keep the development history:

* understandable
* incremental
* easy to review
* aligned with real engineering workflows

---

# Commit Style

Use **Conventional Commits**:

```text
chore:
docs:
feat:
fix:
refactor:
test:
```

## Commit Type Meaning

| Type        | Purpose                                        |
| ----------- | ---------------------------------------------- |
| `chore:`    | Tooling, setup, configuration                  |
| `docs:`     | Documentation updates                          |
| `feat:`     | New features                                   |
| `fix:`      | Bug fixes                                      |
| `refactor:` | Internal improvements without behavior changes |
| `test:`     | Tests and validation                           |

---

# Suggested Commit Plan

## 1. Initial Structure

```text
chore: initialize assessment monorepo structure
```

Includes:

* monorepo folders
* workspace setup
* initial project scaffolding
* documentation structure

---

## 2. Documentation & Specs

```text
docs: add project README and architecture notes
docs: add feature specs and architecture notes
docs: document AI-assisted development workflow
```

Includes:

* architecture overview
* technical decisions
* feature specifications
* coding conventions
* AI workflow documentation

---

## 3. Database Setup

```text
feat: add prisma schema for clients and orders
feat: add sync status fields to local models
```

Includes:

* Prisma schema
* client and order models
* sync status fields
* database relations

---

## 4. API Foundation

```text
feat: add express API bootstrap
feat: add environment configuration
feat: add prisma client integration
```

Includes:

* Express setup
* environment validation
* database connection
* API initialization

---

## 5. Client Flow

```text
feat: add client creation API
feat: add Odoo partner sync service
feat: display client sync status
```

Includes:

* client routes
* client service layer
* Odoo `res.partner` integration
* sync persistence
* frontend client flow

---

## 6. Order Flow

```text
feat: add order creation API
feat: add Odoo sale order sync service
feat: display order sync status
```

Includes:

* order routes
* order service layer
* Odoo `sale.order` integration
* product handling
* sync persistence

---

## 7. Frontend

```text
feat: add client form and list
feat: add order form and list
```

Includes:

* forms
* list views
* sync status indicators
* error display

The UI should remain intentionally simple.

---

## 8. Docker Setup

```text
chore: add Dockerfiles for api and web
chore: complete docker compose setup
```

Includes:

* Dockerfiles
* service orchestration
* Odoo setup
* PostgreSQL setup
* mounted addons folder

---

## 9. Error Handling & Documentation

```text
fix: persist failed Odoo sync status
docs: add Odoo setup and reviewer flow
docs: document assumptions and improvements
```

Includes:

* sync error persistence
* clearer logs
* reviewer instructions
* assumptions and trade-offs

---

## 10. Final Polish

```text
refactor: simplify Odoo service boundaries
docs: finalize README and AI usage notes
```

Includes:

* architecture cleanup
* documentation refinement
* final validation
* reviewer experience improvements

---

# Commit Rules

## One Commit = One Logical Change

Do not group unrelated modifications into a single commit.

Examples of bad commits:

* database changes + frontend redesign
* Docker setup + unrelated bug fixes
* documentation + large architecture refactor

---

# Recommended Workflow

For each feature:

1. Write or update specs.
2. Implement a small part.
3. Review generated code.
4. Test locally.
5. Commit only validated changes.

---

# Goal

The Git history should demonstrate:

* structured thinking
* incremental delivery
* engineering discipline
* maintainability
* ability to work in a collaborative environment
