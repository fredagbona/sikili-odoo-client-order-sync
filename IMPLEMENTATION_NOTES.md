# Implementation Notes

This document explains how I approached the Sikili technical assessment, how I structured the work, what I researched, which decisions I made manually, and how AI tools were used during development.

The goal is to make the engineering process transparent, not only the final result.

---

## 1. How I Approached the Assessment

I started by reading the full assessment carefully and separating the requirements into three categories:

1. **Core requirements**

   * create clients locally
   * sync clients to Odoo as `res.partner`
   * create sale orders locally
   * sync sale orders to Odoo as `sale.order`
   * keep local references to Odoo IDs
   * expose sync status clearly

2. **Engineering requirements**

   * use a relational database
   * avoid hardcoded credentials
   * isolate Odoo API calls in a dedicated service layer
   * handle Odoo API failures clearly
   * provide a reproducible Docker Compose setup

3. **Review requirements**

   * clear README
   * honest assumptions and trade-offs
   * easy local setup
   * documented AI usage
   * no over-engineering

My main objective was to build a simple but reliable system that is easy to review, easy to run locally, and explicit about synchronization behavior.

---

## 2. Architecture Decisions

### Monorepo

I chose a monorepo structure because the reviewer needs to run the full stack locally.

A monorepo keeps everything in one place:

* frontend
* backend
* database package
* shared types
* Docker Compose setup
* documentation
* AI workflow notes

This improves reviewer experience and avoids forcing the reviewer to clone or configure multiple repositories.

### Separate Frontend and Backend Apps

Even though the project is in a monorepo, the frontend and backend are separated:

```text
apps/web
apps/api
```

This keeps boundaries clear:

* the frontend handles forms and display
* the backend owns business logic and synchronization
* the frontend never talks directly to Odoo

### Dedicated Odoo Service Layer

All Odoo API calls are isolated under:

```text
apps/api/src/services/odoo
```

I made this decision because the assessment explicitly asks not to mix Odoo logic into route handlers.

This also makes the code easier to debug, replace, and test.

### Local Database as Source of Local State

The local database stores clients, orders, Odoo IDs, and sync status.

This allows the app to show clearly whether each record is:

```text
PENDING
SYNCED
FAILED
```

This is important because synchronization with external systems can fail, and the app should not hide those failures.

---

## 3. Odoo Research and Model Choices

I was not treating Odoo as a black box. I first identified the minimum Odoo models needed for the requested flow.

### `res.partner`

I chose `res.partner` for clients because it is the standard Odoo model for customers, contacts, companies, and partners.

This maps naturally to a client created from the local platform.

### `sale.order`

I chose `sale.order` for sale orders because it is the standard Odoo model for quotations and sales orders.

Each sale order is linked to the correct `res.partner` through the partner ID returned by Odoo.

### `sale.order.line`

A sale order needs at least one line to represent the product being sold.

The app therefore creates a sale order line with:

* product
* quantity
* unit price

### `product.product`

Odoo sale order lines require a product reference.

To keep the project simple, the app can search for a product by name or create one when needed.

This avoids building a full product catalog UI while still respecting Odoo’s data model.

---

## 4. Synchronization Strategy

The synchronization flow is intentionally simple and synchronous.

For client creation:

```text
create local client
→ attempt Odoo res.partner creation
→ update local client with Odoo partner ID or failed status
```

For order creation:

```text
create local order
→ ensure client has Odoo partner ID
→ find or create product in Odoo
→ create sale.order
→ create sale.order.line
→ update local order with Odoo order ID or failed status
```

I intentionally avoided adding a queue or background worker at this stage.

Reason:

The assessment values clarity and working code over complex infrastructure. A queue would be a good production improvement, but it would add unnecessary complexity for this scope.

---

## 5. Error Handling Strategy

The application must never silently fail.

If Odoo synchronization fails:

* the local record is kept
* the sync status becomes `FAILED`
* the error message is stored locally
* the error is logged clearly
* the frontend displays the failed status

I separated two kinds of errors:

### Validation Errors

These happen when the input is invalid.

Examples:

* missing client name
* missing product name
* invalid amount
* selected client does not exist
* selected client is not synced to Odoo

For validation errors, the local record should generally not be created.

### Sync Errors

These happen when local data is valid, but Odoo fails.

Examples:

* Odoo is unavailable
* Odoo credentials are incorrect
* JSON-RPC payload is rejected
* product creation fails
* sale order creation fails

For sync errors, the local record should remain visible with a `FAILED` status.

---

## 6. What I Did Manually

Before using AI for implementation, I manually defined:

* the project architecture
* the monorepo structure
* the feature decomposition
* the data model direction
* the Odoo model choices
* the synchronization strategy
* the error handling philosophy
* the Docker Compose strategy
* the coding rules
* the commit strategy
* the Definition of Done for each feature
* the reviewer experience expectations

I also wrote detailed specifications for the major features before implementation.

These specs were used to constrain AI output and avoid uncontrolled code generation.

---

## 7. How I Used AI

AI tools were used as implementation assistants, not as autonomous decision makers.

I used AI to help with:

* structuring specifications
* reviewing architectural trade-offs
* exploring Odoo JSON-RPC patterns
* generating first-pass code from detailed specs
* improving documentation
* identifying edge cases
* checking whether the implementation stayed aligned with the assessment

I used Cursor as the AI coding environment.

The AI was guided by:

* `.cursor/rules.md`
* feature specs in `specs/features/`
* coding conventions in `docs/conventions/`
* AI workflow rules in `docs/workflow/`
* commit strategy in `specs/commits/`

The AI was not asked to generate the entire project at once.

Instead, the work was broken into small steps and reviewed incrementally.

---

## 8. How AI Output Was Reviewed

AI-generated code was reviewed manually before being accepted.

For each generated change, I checked:

* does it match the feature spec?
* does it keep Odoo calls isolated?
* does it avoid hardcoded credentials?
* does it handle errors explicitly?
* is it simple enough for the assessment?
* can I explain the code?
* does it avoid unnecessary abstractions?

If the answer was no, I adjusted or rejected the output.

The objective was not to maximize generated code volume, but to accelerate delivery while keeping engineering ownership.

---

## 9. Problems and Trade-offs

### Avoiding Over-Engineering

A natural improvement would be to introduce background jobs and retries.

I chose not to implement that in the first version because the assessment explicitly prioritizes clarity and working code.

The current synchronous approach is easier to review and enough to demonstrate the required flow.

### Product Handling in Odoo

Odoo requires products for sale order lines.

Instead of building a full product catalog, I chose a simple find-or-create strategy by product name.

This keeps the focus on the requested sync flow.

### Local State vs Odoo State

The local app stores its own state and Odoo references.

This makes failures visible and allows future improvements such as retries, reconciliation, and sync dashboards.

---

## 10. What I Would Improve With More Time

With more time, I would add:

* retry mechanism for failed syncs
* background job queue
* idempotency keys to avoid duplicate Odoo records
* reconciliation job between local database and Odoo
* structured logging with request IDs
* integration tests against a local Odoo instance
* admin action to retry failed syncs
* more complete product catalog synchronization
* deployment monitoring and alerts

I did not implement these immediately because they would add complexity beyond the assessment scope.

---

## 11. Summary

My approach was to treat the assessment like a small production integration project:

* understand the external system
* keep boundaries clean
* make failures visible
* document trade-offs
* optimize for reviewer experience
* avoid unnecessary complexity

AI was used to accelerate implementation, but the architecture, constraints, specifications, and validation process were defined manually.
