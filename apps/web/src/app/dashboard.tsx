"use client";

import { useCallback, useEffect, useState } from "react";

import { ClientForm } from "@/components/client-form";
import { ClientList } from "@/components/client-list";
import { OrderForm } from "@/components/order-form";
import { OrderList } from "@/components/order-list";
import {
  type ClientRow,
  type OrderRow,
  getBrowserApiBase,
} from "@/lib/api";

type Props = {
  initialClients: ClientRow[];
  initialOrders: OrderRow[];
};

export function Dashboard({ initialClients, initialOrders }: Props) {
  const [clients, setClients] = useState<ClientRow[]>(initialClients);
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const refreshClients = useCallback(async () => {
    setLoadingClients(true);
    setFormError("");
    try {
      const res = await fetch(`${getBrowserApiBase()}/clients`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Clients request failed (${res.status})`);
      setClients((await res.json()) as ClientRow[]);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingClients(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    setLoadingOrders(true);
    setFormError("");
    try {
      const res = await fetch(`${getBrowserApiBase()}/orders`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Orders request failed (${res.status})`);
      setOrders((await res.json()) as OrderRow[]);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(t);
  }, [banner]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Sikili — Odoo sync assessment
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Create clients (→ <code className="rounded bg-zinc-100 px-1">res.partner</code>
          ), then sale orders (→ <code className="rounded bg-zinc-100 px-1">sale.order</code>
          ). Sync status is always visible.
        </p>
      </header>

      {banner ? (
        <p className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          {banner}
        </p>
      ) : null}
      {formError ? (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {formError}
        </p>
      ) : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">1. Create client</h2>
        <ClientForm
          onDone={() => void refreshClients()}
          onError={(m) => setFormError(m)}
          onSuccessMessage={(m) => setBanner(m)}
        />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900">2. Clients</h2>
          <button
            type="button"
            onClick={() => void refreshClients()}
            className="text-sm text-zinc-600 underline"
          >
            Refresh
          </button>
        </div>
        <ClientList clients={clients} loading={loadingClients} />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">
          3. Create sale order
        </h2>
        <OrderForm
          clients={clients}
          onDone={() => {
            void refreshOrders();
            void refreshClients();
          }}
          onError={(m) => setFormError(m)}
          onSuccessMessage={(m) => setBanner(m)}
        />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900">4. Orders</h2>
          <button
            type="button"
            onClick={() => void refreshOrders()}
            className="text-sm text-zinc-600 underline"
          >
            Refresh
          </button>
        </div>
        <OrderList orders={orders} loading={loadingOrders} />
      </section>
    </div>
  );
}
