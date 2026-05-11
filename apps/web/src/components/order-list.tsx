import type { OrderRow } from "@/lib/api";

type Props = {
  orders: OrderRow[];
  loading?: boolean;
};

export function OrderList({ orders, loading }: Props) {
  if (loading) {
    return <p className="text-sm text-zinc-500">Loading orders…</p>;
  }
  if (orders.length === 0) {
    return <p className="text-sm text-zinc-500">No orders yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((o) => (
        <li
          key={o.id}
          className="rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm"
        >
          <div className="font-medium text-zinc-900">{o.productName}</div>
          <div className="mt-1 text-zinc-600">
            Client: {o.client.name} · Amount: {o.amount}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-zinc-800">
              Status: {o.syncStatus}
            </span>
            {o.odooOrderId != null ? (
              <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-zinc-800">
                Odoo order #{o.odooOrderId}
              </span>
            ) : null}
          </div>
          {o.syncStatus === "FAILED" && o.syncError ? (
            <p className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
              <span className="font-medium">Error: </span>
              {o.syncError}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
