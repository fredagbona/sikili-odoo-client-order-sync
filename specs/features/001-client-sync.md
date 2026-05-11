# Feature 001 — Client Sync with Odoo

---

# Goal

Allow a user to create a client from the web application and automatically create the matching customer/contact in Odoo.

The Odoo record must be stored as a `res.partner`.

The local database must keep the Odoo partner ID and the sync status.

---

# Scope

This feature covers only client creation and client listing.

## Included

* Create a client locally
* Sync the client to Odoo as `res.partner`
* Store the returned Odoo partner ID locally
* Store sync status locally
* Store sync error if Odoo sync fails
* List clients in the web app
* Display client sync status in the UI

## Not Included

* Authentication
* Client edit
* Client delete
* Retry queue
* Background workers
* Advanced UI styling
* Complex Odoo custom modules

Keep the implementation simple and reviewable.

---

# User Flow

1. User opens the web app.
2. User fills the client form with:

   * name
   * phone number
   * email address
3. User submits the form.
4. Backend validates the payload.
5. Backend creates the client locally with sync status `PENDING`.
6. Backend calls Odoo JSON-RPC to create a `res.partner`.
7. If Odoo sync succeeds:

   * store `odooPartnerId`
   * update sync status to `SYNCED`
   * return the client to the frontend
8. If Odoo sync fails:

   * keep the local client
   * update sync status to `FAILED`
   * store the error message
   * return a meaningful response to the frontend
9. User can see the client in the clients list.
10. Reviewer can confirm that the client exists in Odoo Contacts.

---

# Local Data Model

Use the existing Prisma setup.

## Client

Minimum fields:

```text
id
name
phone
email
odooPartnerId
syncStatus
syncError
createdAt
updatedAt
```

## Sync Status Values

```text
PENDING
SYNCED
FAILED
```

Use an enum if possible.

---

# API Endpoints

## Create Client

```http
POST /clients
```

### Request Body

```json
{
  "name": "John Doe",
  "phone": "+2250700000000",
  "email": "john@example.com"
}
```

### Successful Response

```json
{
  "id": "local-client-id",
  "name": "John Doe",
  "phone": "+2250700000000",
  "email": "john@example.com",
  "odooPartnerId": 12,
  "syncStatus": "SYNCED",
  "syncError": null
}
```

### Failed Odoo Sync Response

The API should still return the local client with `FAILED` status.

```json
{
  "id": "local-client-id",
  "name": "John Doe",
  "phone": "+2250700000000",
  "email": "john@example.com",
  "odooPartnerId": null,
  "syncStatus": "FAILED",
  "syncError": "Unable to create partner in Odoo"
}
```

The exact HTTP status can be `201` if local creation succeeded, but the response must clearly expose the failed sync status.

Keep it simple.

---

## List Clients

```http
GET /clients
```

### Response

```json
[
  {
    "id": "local-client-id",
    "name": "John Doe",
    "phone": "+2250700000000",
    "email": "john@example.com",
    "odooPartnerId": 12,
    "syncStatus": "SYNCED",
    "syncError": null
  }
]
```

---

# Odoo Integration

All Odoo-specific logic must live in:

```text
apps/api/src/services/odoo
```

Do not call Odoo directly from route handlers.

## Odoo Model

Use:

```text
res.partner
```

## Fields to Send

Minimum fields:

```json
{
  "name": "John Doe",
  "phone": "+2250700000000",
  "email": "john@example.com"
}
```

## Expected Result

Odoo returns the created partner ID.

Store it locally as:

```text
client.odooPartnerId
```

---

# Backend Implementation Notes

Keep the backend simple.

Recommended structure:

```text
apps/api/src/modules/clients/
  clients.routes.ts
  clients.service.ts

apps/api/src/services/odoo/
  odoo.client.ts
  odoo.partner.service.ts
```

## Route Handler Responsibility

The route handler should only:

* validate request body
* call `clients.service`
* return response

## Client Service Responsibility

The client service should:

* create the local client
* call the Odoo partner service
* update local sync status
* handle sync failure clearly

## Odoo Partner Service Responsibility

The Odoo partner service should:

* build the JSON-RPC payload
* call Odoo
* return the partner ID
* throw a clear error if Odoo fails

---

# Frontend Requirements

Keep the UI intentionally simple.

The page should include:

* client creation form
* client list
* sync status visible for each client
* sync error visible if status is `FAILED`

No advanced design is required.

Clarity matters more than styling.

---

# Error Handling

If Odoo sync fails:

* do not delete the local client
* set `syncStatus` to `FAILED`
* store the error in `syncError`
* log the error with useful context
* show the failed status in the UI

Example log message:

```text
[ODOO_PARTNER_SYNC_FAILED] clientId=<id> message=<error>
```

---

# Definition of Done

* [ ] A client can be created from the web app.
* [ ] The client is stored in the local database.
* [ ] The backend attempts to create a `res.partner` in Odoo.
* [ ] On success, `odooPartnerId` is stored locally.
* [ ] On success, `syncStatus` becomes `SYNCED`.
* [ ] On failure, `syncStatus` becomes `FAILED`.
* [ ] On failure, `syncError` is stored.
* [ ] Client list displays local clients.
* [ ] Client list displays sync status.
* [ ] Odoo calls are isolated in the Odoo service layer.
* [ ] Route handlers remain thin.
* [ ] No credentials are hardcoded.

---

# Manual Test Plan

1. Start the stack.
2. Open the web app.
3. Create a client.
4. Confirm the client appears in the web app.
5. Open Odoo.
6. Confirm the client exists as a contact / partner.
7. Check that the local client has an Odoo partner ID.
8. Stop or misconfigure Odoo temporarily.
9. Create another client.
10. Confirm the local client is kept with `FAILED` sync status.

---

# Implementation Guidance for AI

When implementing this feature:

* do not build unrelated features
* do not add authentication
* do not add background workers
* do not create complex abstractions
* keep Odoo calls isolated
* keep route handlers simple
* prefer clear code over clever code
* update documentation only if needed
