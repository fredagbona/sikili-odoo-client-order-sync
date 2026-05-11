import { OdooClient } from "./odoo.client.js";

export type PartnerValues = {
  name: string;
  phone: string;
  email: string;
};

/**
 * Creates a res.partner in Odoo. Throws on failure so callers can persist FAILED sync.
 */
export async function createResPartner(
  odoo: OdooClient,
  values: PartnerValues,
): Promise<number> {
  const uid = await odoo.authenticate();
  const partnerId = await odoo.executeKw<number>(uid, "res.partner", "create", [
    values,
  ]);
  if (typeof partnerId !== "number") {
    throw new Error("Odoo did not return a numeric partner id");
  }
  return partnerId;
}
