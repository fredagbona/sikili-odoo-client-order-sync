export type SyncStatus = "PENDING" | "SYNCED" | "FAILED";

export type ClientRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  odooPartnerId: number | null;
  syncStatus: SyncStatus;
  syncError: string | null;
};

export type OrderRow = {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    odooPartnerId: number | null;
  };
  productName: string;
  amount: number;
  odooOrderId: number | null;
  syncStatus: SyncStatus;
  syncError: string | null;
};

export function getBrowserApiBase(): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  return base.replace(/\/+$/, "");
}

export function getServerApiBase(): string {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:4000"
  ).replace(/\/+$/, "");
}

export async function serverFetchClients(): Promise<ClientRow[]> {
  try {
    const res = await fetch(`${getServerApiBase()}/clients`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as ClientRow[];
  } catch {
    return [];
  }
}

export async function serverFetchOrders(): Promise<OrderRow[]> {
  try {
    const res = await fetch(`${getServerApiBase()}/orders`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as OrderRow[];
  } catch {
    return [];
  }
}

export function formatApiError(body: unknown, status: number): string {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error: unknown }).error;
    if (typeof err === "string") return err;
    return JSON.stringify(err);
  }
  return `Request failed (${status})`;
}
