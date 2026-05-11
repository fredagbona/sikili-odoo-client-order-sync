# Feature 003 — Frontend Flows

---

# Goal

Build a simple frontend that allows the reviewer to test the full client and sale order synchronization flow without needing API tools.

The UI does not need to be visually advanced.

The priority is clarity, usability, and visibility of sync status.

---

# Scope

This feature covers the user-facing web interface for:

* creating clients
* listing clients
* creating sale orders
* listing sale orders
* displaying Odoo sync status
* displaying sync errors clearly

## Included

* Client creation form
* Clients list
* Sale order creation form
* Orders list
* Client selector for sale order creation
* Sync status badges or labels
* Visible sync error messages
* Basic loading states
* Basic success/error feedback

## Not Included

* Authentication
* Advanced UI design
* Dashboard analytics
* Client edit/delete
* Order edit/delete
* Product catalog management
* Complex state management
* UI component libraries unless already available

Keep the frontend simple and reviewer-friendly.

---

# Pages

Use a minimal page structure.

## Recommended Route

```text
/
```

The home page can contain all flows:

1. Client creation
2. Client list
3. Sale order creation
4. Order list

This avoids unnecessary navigation and keeps the assessment easy to test.

---

# Frontend Layout

Recommended layout:

```text
Page Title
Short explanation

Section 1: Create Client
Section 2: Clients
Section 3: Create Sale Order
Section 4: Orders
```

Use simple cards or bordered sections if convenient.

No advanced styling is required.

---

# Client Creation Form

## Fields

* name
* phone
* email

## Behavior

1. User fills the form.
2. User submits.
3. Frontend calls `POST /clients`.
4. On success:

   * reset the form
   * refresh the clients list
   * show success feedback
5. If sync status is `FAILED`:

   * still show the created client
   * display the failed status and sync error
6. On validation/API error:

   * show a clear error message

## Minimal Validation

Frontend may validate:

* name is required
* phone is required
* email is required

Backend remains the source of truth.

---

# Clients List

## Display Fields

For each client, show:

* name
* phone
* email
* Odoo partner ID
* sync status
* sync error if any

## Sync Status Display

Show the status clearly:

```text
SYNCED
FAILED
PENDING
```

A simple text label is enough.

Optional color coding is fine but not required.

---

# Sale Order Creation Form

## Fields

* client selector
* product name
* amount

## Behavior

1. User selects an existing client.
2. User enters product name and amount.
3. User submits.
4. Frontend calls `POST /orders`.
5. On success:

   * reset the form
   * refresh the orders list
   * show success feedback
6. If sync status is `FAILED`:

   * still show the created order if the API returns one
   * display the failed status and sync error
7. On validation/API error:

   * show a clear error message

---

# Client Selector Rules

The order form should use the local client list.

If possible, only allow selecting clients that have:

```text
syncStatus = SYNCED
odooPartnerId != null
```

Reason:

A sale order must be linked to an existing Odoo partner.

If this filtering adds complexity, keep all clients selectable but show a clear error if the selected client is not synced.

Prefer simple implementation.

---

# Orders List

## Display Fields

For each order, show:

* client name
* product name
* amount
* Odoo order ID
* sync status
* sync error if any

## Sync Status Display

Show the status clearly:

```text
SYNCED
FAILED
PENDING
```

A simple text label is enough.

---

# API Integration

Use the configured API URL.

Frontend environment variable:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Expected endpoints:

```http
GET /clients
POST /clients
GET /orders
POST /orders
```

Keep API calls simple.

Recommended folder:

```text
apps/web/src/lib/api.ts
```

---

# Error Display

Errors must be visible to the user.

Examples:

* invalid form data
* API unavailable
* Odoo sync failed
* selected client is not synced

Do not hide errors in the console only.

---

# Loading States

Keep loading states simple.

Examples:

* disable submit button while submitting
* show `Loading clients...`
* show `Loading orders...`

No complex state management is needed.

---

# Empty States

Show simple empty states:

```text
No clients yet.
No orders yet.
```

This improves reviewer experience.

---

# Implementation Notes

Keep frontend code simple.

Recommended structure:

```text
apps/web/src/app/page.tsx
apps/web/src/lib/api.ts
apps/web/src/components/client-form.tsx
apps/web/src/components/client-list.tsx
apps/web/src/components/order-form.tsx
apps/web/src/components/order-list.tsx
```

If the implementation is small enough, components can be kept minimal.

Avoid introducing unnecessary libraries.

---

# UX Priority

The reviewer should understand the system quickly.

The UI should make the flow obvious:

```text
1. Create client
2. Confirm client sync status
3. Create order for synced client
4. Confirm order sync status
```

Add short helper text if useful.

---

# Definition of Done

* [ ] The home page loads successfully.
* [ ] User can create a client from the UI.
* [ ] Client list refreshes after creation.
* [ ] Client sync status is visible.
* [ ] Client sync error is visible if sync fails.
* [ ] User can create an order from the UI.
* [ ] Order form includes a client selector.
* [ ] Order list refreshes after creation.
* [ ] Order sync status is visible.
* [ ] Order sync error is visible if sync fails.
* [ ] API errors are surfaced to the user.
* [ ] UI remains simple and easy to review.

---

# Manual Test Plan

1. Start the stack.
2. Open `http://localhost:3000`.
3. Confirm the page loads.
4. Create a client.
5. Confirm the client appears in the list.
6. Confirm the sync status is visible.
7. Create a sale order for that client.
8. Confirm the order appears in the list.
9. Confirm the order sync status is visible.
10. Temporarily break Odoo config or stop Odoo.
11. Try creating another client or order.
12. Confirm the UI displays a meaningful error or failed sync status.

---

# Implementation Guidance for AI

When implementing this feature:

* do not build a complex UI
* do not add authentication
* do not add routing complexity
* do not add unnecessary state management libraries
* keep forms simple
* keep lists readable
* make sync status visible
* make errors visible
* prioritize reviewer clarity over visual polish
