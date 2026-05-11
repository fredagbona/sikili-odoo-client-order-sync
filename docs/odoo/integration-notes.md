
Odoo Integration Notes
API Choice

This project uses Odoo JSON-RPC.

Models
res.partner

Used for clients because it is the standard Odoo model for customers and contacts.

sale.order

Used for sale orders because it is the standard Odoo model for quotations and sales orders.

product.product

Used for products in sale order lines.

Sync Strategy

The local database stores Odoo references:

clients.odoo_partner_id
orders.odoo_order_id

Each sync operation has a status:

PENDING
SYNCED
FAILED
