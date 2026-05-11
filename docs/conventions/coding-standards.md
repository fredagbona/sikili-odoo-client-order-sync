# Coding Standards

## General

- Use TypeScript everywhere.
- Prefer explicit naming.
- Keep functions short and focused.
- Avoid clever abstractions.
- Prefer readability over compression.
- Avoid unnecessary dependencies.

## Backend

- Route handlers should only:
  - validate input
  - call services
  - return responses

- Business logic should live in module services.
- Odoo integration must live in the Odoo service layer.
- Environment variables must be loaded from a dedicated config module.
- Never hardcode credentials.

## Error Handling

Errors should include enough context to debug the issue.

For sync errors, persist:

- sync status
- sync error message
- Odoo operation attempted

Do not hide errors from the user.

## Database

Use clear model names:

- `Client`
- `Order`

Use clear fields:

- `odooPartnerId`
- `odooOrderId`
- `syncStatus`
- `syncError`

Prefer enums for sync statuses.

## Frontend

The UI should stay simple.

Must include:

- create client form
- clients list
- create order form
- orders list
- sync status display
- error display

## Logging

Logs should be clear and useful.

Example:

```text
[ODOO_SYNC_FAILED] model=res.partner operation=create clientId=...
Tests / Validation

Manual validation is acceptable for the assessment, but document the tested flow.

If time allows, add basic service tests.
