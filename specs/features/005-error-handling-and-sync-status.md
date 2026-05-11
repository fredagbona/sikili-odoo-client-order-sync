# Feature 005 — Error Handling and Sync Status

---

# Goal

Make synchronization behavior explicit, reliable, and easy to debug.

The application must never silently fail when Odoo synchronization fails.

Every client and order must expose a clear sync status so the reviewer can understand what happened locally and what happened in Odoo.

---

# Scope

This feature covers sync status handling and error visibility for both:

* client synchronization
* sale order synchronization

## Included

* Persist sync status locally
* Persist sync error messages locally
* Log Odoo sync failures clearly
* Show sync status in the frontend
* Show sync errors in the frontend
* Avoid silent failures
* Keep local records even when Odoo sync fails

## Not Included

* Automatic retry queue
* Background workers
* Webhooks from Odoo
* Advanced observability stack
* External logging services
* Alerting system
* Complex reconciliation jobs

Keep the implementation simple and focused on assessment requirements.

---

# Sync Status Values

Use the same sync status values for clients and orders:

```text
PENDING
SYNCED
FAILED
```

Prefer using a Prisma enum if possible.

---

# Status Meaning

## `PENDING`

The local record was created and sync has not completed yet.

This status may be short-lived in the current synchronous implementation.

## `SYNCED`

The Odoo sync completed successfully.

Required references must be stored locally:

```text
clients.odooPartnerId
orders.odooOrderId
```

## `FAILED`

The local record exists but the Odoo sync failed.

The failure reason must be stored in:

```text
syncError
```

---

# Core Rule

If Odoo sync fails:

* do not delete the local record
* mark the record as `FAILED`
* store a useful error message
* log the error clearly
* return the local record with the failed status
* make the failure visible in the UI

The reviewer should never need to inspect source code to know that a sync failed.

---

# Client Sync Failure

When client sync fails:

1. Create the local client.
2. Attempt to create `res.partner` in Odoo.
3. If Odoo fails:

   * keep the local client
   * set `syncStatus` to `FAILED`
   * set `syncError` to a clear message
   * keep `odooPartnerId` as `null`

Example local state:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+2250700000000",
  "odooPartnerId": null,
  "syncStatus": "FAILED",
  "syncError": "Odoo partner creation failed: authentication failed"
}
```

---

# Order Sync Failure

When order sync fails:

1. Validate that the client exists.
2. Validate that the client has an `odooPartnerId`.
3. Create the local order.
4. Attempt to create the product / sale order / sale order line in Odoo.
5. If Odoo fails:

   * keep the local order
   * set `syncStatus` to `FAILED`
   * set `syncError` to a clear message
   * keep `odooOrderId` as `null`

Example local state:

```json
{
  "clientId": "local-client-id",
  "productName": "Samsung Galaxy A55",
  "amount": 250000,
  "odooOrderId": null,
  "syncStatus": "FAILED",
  "syncError": "Odoo sale order creation failed: product creation failed"
}
```

---

# Validation Failures vs Sync Failures

Separate validation errors from synchronization errors.

## Validation Error

A validation error means the request itself is invalid.

Examples:

* missing client name
* invalid email
* missing product name
* invalid amount
* selected client does not exist
* selected client is not synced to Odoo

For validation errors:

* do not create the local record if the input is invalid
* return a clear API error
* show the error in the frontend

## Sync Error

A sync error means the local data is valid, but Odoo sync failed.

Examples:

* Odoo is down
* wrong Odoo credentials
* Odoo rejects the payload
* product creation fails
* sale order creation fails

For sync errors:

* keep the local record
* mark it as `FAILED`
* expose the error clearly

---

# API Response Behavior

If local creation succeeds but Odoo sync fails, return the local entity with:

```text
syncStatus = FAILED
syncError = <message>
```

This can still return HTTP `201` because the local record was created.

The frontend must rely on `syncStatus` to display the actual synchronization result.

Keep the behavior simple and document it.

---

# Logging Rules

Use clear and searchable log messages.

## Client Sync Failure Log

```text
[ODOO_PARTNER_SYNC_FAILED] clientId=<id> message=<error>
```

## Order Sync Failure Log

```text
[ODOO_SALE_ORDER_SYNC_FAILED] orderId=<id> clientId=<clientId> message=<error>
```

## Odoo Authentication Failure Log

```text
[ODOO_AUTH_FAILED] message=<error>
```

Logs should include enough context to debug without exposing sensitive credentials.

---

# Sensitive Data Rules

Never log:

* Odoo password
* database password
* API keys
* full environment variables

It is acceptable to log:

* entity IDs
* operation names
* model names
* sanitized error messages

---

# Frontend Display Rules

The UI must make sync status visible.

For each client and order, display:

```text
SYNCED
FAILED
PENDING
```

If status is `FAILED`, display the sync error.

Keep the display simple.

Example:

```text
Status: FAILED
Error: Odoo partner creation failed: authentication failed
```

---

# Error Message Philosophy

Error messages should be useful but not overly technical.

Good examples:

```text
Unable to create client in Odoo. Please check Odoo configuration.
Unable to create sale order in Odoo. Please check logs for details.
Selected client is not synced to Odoo yet.
```

Avoid vague messages:

```text
Something went wrong.
Error.
Failed.
```

---

# Implementation Notes

Keep implementation simple.

Recommended backend approach:

1. Create local record with `PENDING`.
2. Attempt Odoo sync.
3. On success, update record to `SYNCED` with Odoo ID.
4. On failure, update record to `FAILED` with `syncError`.
5. Return the final local record.

This avoids introducing a queue while still making sync behavior visible.

---

# Future Improvement Notes

Do not implement these unless there is extra time.

Possible improvements:

* retry failed sync manually
* background retry worker
* idempotency keys
* sync reconciliation job
* structured logging with request IDs
* admin screen to retry failed records

Mention these in README as future improvements if relevant.

---

# Definition of Done

* [ ] Clients have `syncStatus`.
* [ ] Clients have `syncError`.
* [ ] Orders have `syncStatus`.
* [ ] Orders have `syncError`.
* [ ] Client sync failures are persisted locally.
* [ ] Order sync failures are persisted locally.
* [ ] Odoo sync failures are logged clearly.
* [ ] Sensitive credentials are never logged.
* [ ] Frontend displays sync status for clients.
* [ ] Frontend displays sync status for orders.
* [ ] Frontend displays sync errors when present.
* [ ] Validation errors are separated from sync errors.
* [ ] README or docs explain sync status behavior.

---

# Manual Test Plan

## Successful Client Sync

1. Start the stack with valid Odoo config.
2. Create a client.
3. Confirm client status is `SYNCED`.
4. Confirm `odooPartnerId` is stored.
5. Confirm client exists in Odoo.

## Failed Client Sync

1. Temporarily break Odoo credentials or stop Odoo.
2. Create a client.
3. Confirm client still exists locally.
4. Confirm client status is `FAILED`.
5. Confirm `syncError` is visible.
6. Confirm no credentials are logged.

## Successful Order Sync

1. Create a synced client.
2. Create an order for that client.
3. Confirm order status is `SYNCED`.
4. Confirm `odooOrderId` is stored.
5. Confirm sale order exists in Odoo.

## Failed Order Sync

1. Temporarily break Odoo config after creating a synced client.
2. Create an order.
3. Confirm order still exists locally.
4. Confirm order status is `FAILED`.
5. Confirm `syncError` is visible.
6. Confirm no credentials are logged.

---

# Implementation Guidance for AI

When implementing this feature:

* do not add a retry queue unless explicitly requested
* do not add background workers
* do not add external logging services
* do not hide errors in console only
* keep sync status handling explicit
* keep error messages useful
* avoid logging secrets
* prefer a simple synchronous sync flow for this assessment
