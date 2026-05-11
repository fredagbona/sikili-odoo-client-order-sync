# Feature 002 — Sale Order Sync with Odoo

---

# Goal

Allow a user to create a sale order for an existing local client and automatically create the matching sale order in Odoo.

The Odoo record must be stored as a `sale.order` and linked to the correct Odoo partner.

The local database must keep the Odoo sale order ID and the sync status.

---

# Scope

This feature covers only sale order creation and order listing.

## Included

* Create a sale order locally for an existing client
* Ensure the selected client has an Odoo partner ID
* Find or create a product in Odoo using the submitted product name
* Create a `sale.order` in Odoo linked to the correct `res.partner`
* Create a sale order line with the product and amount
* Store the returned Odoo sale order ID locally
* Store sync status locally
* Store sync error if Odoo sync fails
* List orders in the web app
* Display order sync status in the UI

## Not Included

* Order edit
* Order delete
* Payment flow
* Invoice validation
* Stock management
* Product catalog management UI
* Retry queue
* Background workers
* Complex Odoo custom modules

Keep the implementation simple and reviewable.

---

# User Flow

1. User opens the web app.
2. User selects an existing client.
3. User fills the sale order form with:

   * product name
   * total price / amount
4. User submits the form.
5. Backend validates the payload.
6. Backend creates the order locally with sync status `PENDING`.
7. Backend checks that the client has an `odooPartnerId`.
8. Backend finds or creates the matching `product.product` in Odoo.
9. Backend creates a `sale.order` in Odoo linked to the correct `res.partner`.
10. Backend adds a sale order line with the product and price.
11. If Odoo sync succeeds:

    * store `odooOrderId`
    * update sync status to `SYNCED`
    * return the order to the frontend
12. If Odoo sync fails:

    * keep the local order
    * update sync status to `FAILED`
    * store the error message
    * return a meaningful response to the frontend
13. User can see the order in the orders list.
14. Reviewer can confirm that the order exists in Odoo Sales and is linked to the correct partner.

---

# Local Data Model

Use the existing Prisma setup.

## Order

Minimum fields:

```text
id
clientId
productName
amount
odooOrderId
syncStatus
syncError
createdAt
updatedAt
```

## Relationship

Each order must belong to a client:

```text
Order.clientId → Client.id
```

The client should already have:

```text
Client.odooPartnerId
```

before a sale order can be synced to Odoo.

---

# Sync Status Values

```text
PENDING
SYNCED
FAILED
```

Use the same enum as the client sync feature.

---

# API Endpoints

## Create Order

```http
POST /orders
```

### Request Body

```json
{
  "clientId": "local-client-id",
  "productName": "Samsung Galaxy A55",
  "amount": 250000
}
```

### Successful Response

```json
{
  "id": "local-order-id",
  "clientId": "local-client-id",
  "productName": "Samsung Galaxy A55",
  "amount": 250000,
  "odooOrderId": 34,
  "syncStatus": "SYNCED",
  "syncError": null
}
```

### Failed Odoo Sync Response

The API should still return the local order with `FAILED` status.

```json
{
  "id": "local-order-id",
  "clientId": "local-client-id",
  "productName": "Samsung Galaxy A55",
  "amount": 250000,
  "odooOrderId": null,
  "syncStatus": "FAILED",
  "syncError": "Unable to create sale order in Odoo"
}
```

The exact HTTP status can be `201` if local creation succeeded, but the response must clearly expose the failed sync status.

Keep it simple.

---

## List Orders

```http
GET /orders
```

### Response

```json
[
  {
    "id": "local-order-id",
    "clientId": "local-client-id",
    "client": {
      "id": "local-client-id",
      "name": "John Doe",
      "odooPartnerId": 12
    },
    "productName": "Samsung Galaxy A55",
    "amount": 250000,
    "odooOrderId": 34,
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

---

# Odoo Models

## `sale.order`

Used to represent the sale order.

## `sale.order.line`

Used to attach the product and price to the sale order.

## `product.product`

Used as the product referenced by the sale order line.

---

# Product Strategy

This assessment does not require a full product catalog.

Use a simple strategy:

1. Search `product.product` by name.
2. If found, reuse the existing product.
3. If not found, create a new product with the submitted product name.
4. Use that product ID in the sale order line.

This keeps the flow simple while preserving correct Odoo relationships.

---

# Sale Order Creation Strategy

Recommended Odoo flow:

1. Create a `sale.order` with:

   * `partner_id`
2. Create a `sale.order.line` with:

   * `order_id`
   * `product_id`
   * `name`
   * `product_uom_qty`
   * `price_unit`

Use quantity `1` and set `price_unit` to the submitted amount.

This is enough for the assessment.

---

# Backend Implementation Notes

Keep the backend simple.

Recommended structure:

```text
apps/api/src/modules/orders/
  orders.routes.ts
  orders.service.ts

apps/api/src/services/odoo/
  odoo.client.ts
  odoo.product.service.ts
  odoo.sale-order.service.ts
```

## Route Handler Responsibility

The route handler should only:

* validate request body
* call `orders.service`
* return response

## Order Service Responsibility

The order service should:

* validate that the client exists locally
* validate that the client has an `odooPartnerId`
* create the local order
* call the Odoo sale order service
* update local sync status
* handle sync failure clearly

## Odoo Product Service Responsibility

The Odoo product service should:

* search for a product by name
* create the product if not found
* return the product ID

## Odoo Sale Order Service Responsibility

The Odoo sale order service should:

* create the sale order
* create the sale order line
* return the sale order ID
* throw a clear error if Odoo fails

---

# Frontend Requirements

Keep the UI intentionally simple.

The page should include:

* order creation form
* client dropdown or selector
* product name input
* amount input
* orders list
* sync status visible for each order
* sync error visible if status is `FAILED`

No advanced design is required.

Clarity matters more than styling.

---

# Error Handling

If Odoo sync fails:

* do not delete the local order
* set `syncStatus` to `FAILED`
* store the error in `syncError`
* log the error with useful context
* show the failed status in the UI

Example log message:

```text
[ODOO_SALE_ORDER_SYNC_FAILED] orderId=<id> clientId=<clientId> message=<error>
```

---

# Edge Cases

Handle these simple cases:

## Client does not exist locally

Return a clear error.

Do not create an order.

## Client exists but has no Odoo partner ID

Return a clear error or mark the order as `FAILED`.

For this assessment, prefer a clear error before creating the order if the client is not synced.

Reason:

A sale order must be linked to a valid Odoo partner.

## Odoo product creation fails

Keep the local order and mark sync as `FAILED`.

## Odoo sale order creation fails

Keep the local order and mark sync as `FAILED`.

---

# Definition of Done

* [ ] An order can be created from the web app.
* [ ] The order is linked to an existing local client.
* [ ] The selected client must have an Odoo partner ID before syncing.
* [ ] The order is stored in the local database.
* [ ] The backend finds or creates a product in Odoo.
* [ ] The backend creates a `sale.order` in Odoo.
* [ ] The backend creates a `sale.order.line` in Odoo.
* [ ] The sale order is linked to the correct Odoo partner.
* [ ] On success, `odooOrderId` is stored locally.
* [ ] On success, `syncStatus` becomes `SYNCED`.
* [ ] On failure, `syncStatus` becomes `FAILED`.
* [ ] On failure, `syncError` is stored.
* [ ] Orders list displays local orders.
* [ ] Orders list displays sync status.
* [ ] Odoo calls are isolated in the Odoo service layer.
* [ ] Route handlers remain thin.
* [ ] No credentials are hardcoded.

---

# Manual Test Plan

1. Start the stack.
2. Create a client.
3. Confirm the client is synced to Odoo.
4. Create a sale order for that client.
5. Confirm the order appears in the web app.
6. Open Odoo Sales.
7. Confirm the sale order exists.
8. Confirm the sale order is linked to the correct partner.
9. Confirm the sale order line contains the submitted product and amount.
10. Stop or misconfigure Odoo temporarily.
11. Create another order.
12. Confirm the local order is kept with `FAILED` sync status.

---

# Implementation Guidance for AI

When implementing this feature:

* do not build unrelated features
* do not add payment logic
* do not add invoicing logic
* do not add stock management
* do not create a product catalog UI
* do not add background workers
* do not create complex abstractions
* keep Odoo calls isolated
* keep route handlers simple
* prefer clear code over clever code
* update documentation only if needed
