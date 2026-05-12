-- Align physical column names with assessment wording (Prisma field names stay camelCase).
ALTER TABLE "Client" RENAME COLUMN "odooPartnerId" TO "odoo_partner_id";
ALTER TABLE "Order" RENAME COLUMN "odooOrderId" TO "odoo_order_id";
