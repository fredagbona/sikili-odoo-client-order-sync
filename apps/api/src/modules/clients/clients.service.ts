import type { Client } from "database";
import { prisma } from "database";

import { env } from "../../config/env.js";
import { OdooClient } from "../../services/odoo/odoo.client.js";
import { createResPartner } from "../../services/odoo/odoo.partner.service.js";

export type CreateClientInput = {
  name: string;
  phone: string;
  email: string;
};

function getOdooClient(): OdooClient {
  return new OdooClient(
    env.ODOO_DB,
    env.ODOO_USERNAME,
    env.ODOO_PASSWORD,
    env.ODOO_URL,
  );
}

export function toClientResponse(client: Client) {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    odooPartnerId: client.odooPartnerId,
    syncStatus: client.syncStatus,
    syncError: client.syncError,
  };
}

export async function createClient(
  input: CreateClientInput,
): Promise<ReturnType<typeof toClientResponse>> {
  const draft = await prisma.client.create({
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
    },
  });

  try {
    const odooId = await createResPartner(getOdooClient(), {
      name: input.name,
      phone: input.phone,
      email: input.email,
    });
    const updated = await prisma.client.update({
      where: { id: draft.id },
      data: {
        odooPartnerId: odooId,
        syncStatus: "SYNCED",
        syncError: null,
      },
    });
    return toClientResponse(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[ODOO_PARTNER_SYNC_FAILED] clientId=${draft.id} message=${message}`,
    );
    const failed = await prisma.client.update({
      where: { id: draft.id },
      data: {
        syncStatus: "FAILED",
        syncError: message,
      },
    });
    return toClientResponse(failed);
  }
}

export async function listClients(): Promise<
  ReturnType<typeof toClientResponse>[]
> {
  const rows = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toClientResponse);
}
