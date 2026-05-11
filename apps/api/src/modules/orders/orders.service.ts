import type { Order } from "database";
import { prisma } from "database";

import { HttpError } from "../../lib/http-error.js";
import { env } from "../../config/env.js";
import { OdooClient } from "../../services/odoo/odoo.client.js";
import { createSaleOrderWithLine } from "../../services/odoo/odoo.sale-order.service.js";

export type CreateOrderInput = {
  clientId: string;
  productName: string;
  amount: number;
};

function getOdooClient(): OdooClient {
  return new OdooClient(
    env.ODOO_DB,
    env.ODOO_USERNAME,
    env.ODOO_PASSWORD,
    env.ODOO_URL,
  );
}

export function toOrderResponse(
  order: Order & {
    client: { id: string; name: string; odooPartnerId: number | null };
  },
) {
  return {
    id: order.id,
    clientId: order.clientId,
    client: {
      id: order.client.id,
      name: order.client.name,
      odooPartnerId: order.client.odooPartnerId,
    },
    productName: order.productName,
    amount: order.amount,
    odooOrderId: order.odooOrderId,
    syncStatus: order.syncStatus,
    syncError: order.syncError,
  };
}

export async function createOrder(input: CreateOrderInput) {
  const client = await prisma.client.findUnique({
    where: { id: input.clientId },
  });
  if (!client) {
    throw new HttpError(400, "The selected client does not exist.");
  }
  if (!client.odooPartnerId) {
    throw new HttpError(
      400,
      "Selected client is not synced to Odoo yet. Wait for SYNCED status before creating an order.",
    );
  }

  const draft = await prisma.order.create({
    data: {
      clientId: input.clientId,
      productName: input.productName,
      amount: input.amount,
    },
  });

  try {
    const odooOrderId = await createSaleOrderWithLine(getOdooClient(), {
      partnerOdooId: client.odooPartnerId,
      productName: input.productName,
      amount: input.amount,
    });
    const updated = await prisma.order.update({
      where: { id: draft.id },
      data: {
        odooOrderId,
        syncStatus: "SYNCED",
        syncError: null,
      },
      include: {
        client: { select: { id: true, name: true, odooPartnerId: true } },
      },
    });
    return toOrderResponse(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[ODOO_SALE_ORDER_SYNC_FAILED] orderId=${draft.id} clientId=${input.clientId} message=${message}`,
    );
    const failed = await prisma.order.update({
      where: { id: draft.id },
      data: {
        syncStatus: "FAILED",
        syncError: message,
      },
      include: {
        client: { select: { id: true, name: true, odooPartnerId: true } },
      },
    });
    return toOrderResponse(failed);
  }
}

export async function listOrders() {
  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true, odooPartnerId: true } },
    },
  });
  return rows.map(toOrderResponse);
}
