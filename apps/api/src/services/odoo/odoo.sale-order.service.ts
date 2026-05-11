import type { OdooClient } from "./odoo.client.js";
import { findOrCreateProductByName } from "./odoo.product.service.js";

export type SaleOrderInput = {
  partnerOdooId: number;
  productName: string;
  amount: number;
};

/**
 * Creates sale.order + sale.order.line in Odoo. Returns the new sale order id.
 */
export async function createSaleOrderWithLine(
  odoo: OdooClient,
  input: SaleOrderInput,
): Promise<number> {
  const uid = await odoo.authenticate();
  const productId = await findOrCreateProductByName(
    odoo,
    uid,
    input.productName,
  );

  const orderId = await odoo.executeKw<number>(uid, "sale.order", "create", [
    {
      partner_id: input.partnerOdooId,
    },
  ]);

  if (typeof orderId !== "number") {
    throw new Error("Odoo did not return a numeric sale order id");
  }

  await odoo.executeKw<number>(uid, "sale.order.line", "create", [
    {
      order_id: orderId,
      product_id: productId,
      name: input.productName,
      product_uom_qty: 1,
      price_unit: input.amount,
    },
  ]);

  return orderId;
}
