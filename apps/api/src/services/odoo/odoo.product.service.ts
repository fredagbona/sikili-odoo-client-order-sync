import type { OdooClient } from "./odoo.client.js";

/**
 * Find product.product by exact name, or create a simple sellable product.
 */
export async function findOrCreateProductByName(
  odoo: OdooClient,
  uid: number,
  name: string,
): Promise<number> {
  const found = await odoo.executeKw<number[]>(
    uid,
    "product.product",
    "search",
    [[["name", "=", name]]],
    { limit: 1 },
  );
  if (Array.isArray(found) && found.length > 0 && typeof found[0] === "number") {
    return found[0]!;
  }

  return odoo.executeKw<number>(uid, "product.product", "create", [
    {
      name,
      type: "consu",
      sale_ok: true,
    },
  ]);
}
