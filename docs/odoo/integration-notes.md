# Odoo Integration Notes

---

# API Choice

This project uses **Odoo JSON-RPC** for all communication between the local application and the Odoo instance.

## Why JSON-RPC?

JSON-RPC was chosen because:

* it is officially supported by Odoo
* it integrates naturally with JavaScript / TypeScript applications
* request and response payloads are simple to debug
* it avoids XML parsing complexity
* it fits well with modern API-oriented backend architectures

---

# Odoo Models Used

## `res.partner`

Used for clients.

### Reason

`res.partner` is the standard Odoo model used for:

* customers
* contacts
* companies
* partners

Since the web application creates clients, this is the most natural and maintainable mapping.

---

## `sale.order`

Used for sale orders.

### Reason

`sale.order` is the standard Odoo model used for:

* quotations
* customer orders
* sales workflows

Each sale order is linked to the correct `res.partner` through the partner reference stored locally.

---

## `product.product`

Used for products inside sale order lines.

### Reason

Odoo sale order lines require a valid product reference.

For simplicity, this assessment can:

* search for an existing product by name
* or create the product dynamically if it does not exist

This keeps the flow simple while preserving correct Odoo relationships.

---

# Sync Strategy

The application keeps its own local database while synchronizing entities with Odoo.

The local database stores Odoo references:

```text
clients.odoo_partner_id
orders.odoo_order_id
```

This allows:

* traceability between systems
* synchronization tracking
* debugging failed syncs
* future reconciliation strategies

---

# Sync Statuses

Each synchronization operation stores a local sync status.

Possible statuses:

```text
PENDING
SYNCED
FAILED
```

## Meaning

### `PENDING`

The local entity exists but synchronization has not completed yet.

### `SYNCED`

The entity was successfully created in Odoo and the Odoo ID reference has been stored locally.

### `FAILED`

The synchronization attempt failed.

The application should:

* persist the local entity
* store the error message
* expose the failure clearly
* avoid silent data loss

---

# Error Handling Philosophy

Odoo synchronization should never fail silently.

If an API request fails:

* the local record must remain persisted
* the sync status must become `FAILED`
* the error should be logged clearly
* the frontend should display a meaningful message

This approach improves:

* observability
* debugging
* operational reliability
* future retry support
