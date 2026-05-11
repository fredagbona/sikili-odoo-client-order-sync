import type { ClientRow } from "@/lib/api";

type Props = {
  clients: ClientRow[];
  loading?: boolean;
};

export function ClientList({ clients, loading }: Props) {
  if (loading) {
    return <p className="text-sm text-zinc-500">Loading clients…</p>;
  }
  if (clients.length === 0) {
    return <p className="text-sm text-zinc-500">No clients yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {clients.map((c) => (
        <li
          key={c.id}
          className="rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm"
        >
          <div className="font-medium text-zinc-900">{c.name}</div>
          <div className="mt-1 text-zinc-600">
            {c.phone} · {c.email}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-zinc-800">
              Status: {c.syncStatus}
            </span>
            {c.odooPartnerId != null ? (
              <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-zinc-800">
                Odoo partner #{c.odooPartnerId}
              </span>
            ) : null}
          </div>
          {c.syncStatus === "FAILED" && c.syncError ? (
            <p className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
              <span className="font-medium">Error: </span>
              {c.syncError}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
