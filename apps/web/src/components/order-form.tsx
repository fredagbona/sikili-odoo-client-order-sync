"use client";

import { useMemo, useState } from "react";

import {
  type ClientRow,
  type OrderRow,
  formatApiError,
  getBrowserApiBase,
} from "@/lib/api";

type Props = {
  clients: ClientRow[];
  onDone: () => void;
  onError: (message: string) => void;
  onSuccessMessage: (message: string) => void;
};

export function OrderForm({
  clients,
  onDone,
  onError,
  onSuccessMessage,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [productName, setProductName] = useState("");
  const [amount, setAmount] = useState("");

  const eligibleClients = useMemo(
    () =>
      clients.filter(
        (c) => c.syncStatus === "SYNCED" && c.odooPartnerId != null,
      ),
    [clients],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onError("");
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      onError("Enter a valid positive amount.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${getBrowserApiBase()}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          productName,
          amount: amountNum,
        }),
      });
      const body: unknown = await res.json();
      if (!res.ok) {
        onError(formatApiError(body, res.status));
        return;
      }
      const order = body as OrderRow;
      onDone();
      setProductName("");
      setAmount("");
      if (order.syncStatus === "FAILED") {
        onSuccessMessage(
          "Order saved locally but Odoo sync failed — see status below.",
        );
      } else {
        onSuccessMessage("Sale order created and synced to Odoo.");
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-4 flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Client</span>
        <select
          required
          className="rounded border border-zinc-300 px-3 py-2 text-zinc-900"
          value={clientId}
          onChange={(ev) => setClientId(ev.target.value)}
        >
          <option value="" disabled>
            Select a synced client
          </option>
          {eligibleClients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (partner #{c.odooPartnerId})
            </option>
          ))}
        </select>
        {eligibleClients.length === 0 ? (
          <p className="text-xs text-amber-800">
            No synced clients yet. Create a client and wait for status SYNCED
            before creating an order.
          </p>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Product name</span>
        <input
          required
          className="rounded border border-zinc-300 px-3 py-2 text-zinc-900"
          value={productName}
          onChange={(ev) => setProductName(ev.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Amount</span>
        <input
          required
          type="number"
          min="0"
          step="0.01"
          className="rounded border border-zinc-300 px-3 py-2 text-zinc-900"
          value={amount}
          onChange={(ev) => setAmount(ev.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading || eligibleClients.length === 0}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Saving…" : "Create sale order"}
      </button>
    </form>
  );
}
