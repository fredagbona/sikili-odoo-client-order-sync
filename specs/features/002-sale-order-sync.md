# Feature 002 — Sale Order Sync with Odoo

## Goal

Allow a user to create a sale order for an existing client and automatically create a matching `sale.order` in Odoo.

## User Flow

1. User selects an existing client.
2. User enters product name and total price.
3. Backend creates the order locally.
4. Backend ensures the client has an Odoo partner ID.
5. Backend finds or creates a product in Odoo.
6. Backend creates a `sale.order` linked to the correct partner.
7. Backend stores the returned Odoo sale order ID.
8. Order is visible in Odoo Sales.

## Data

Required fields:

- client_id
- product_name
- amount

Local fields:

- id
- client_id
- product_name
- amount
- odoo_order_id
- sync_status
- sync_error
- created_at
- updated_at

## Definition of Done

- Sale order can be created from the web app.
- Order is stored locally.
- `sale.order` is created in Odoo.
- Order is linked to the correct Odoo partner.
- Odoo order ID is stored locally.
- Sync errors are logged and surfaced.
- Odoo logic is isolated in the Odoo service layer.
