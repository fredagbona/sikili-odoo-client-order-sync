"use client";

import { useState } from "react";

import {
  type ClientRow,
  formatApiError,
  getBrowserApiBase,
} from "@/lib/api";

type Props = {
  onDone: () => void;
  onError: (message: string) => void;
  onSuccessMessage: (message: string) => void;
};

export function ClientForm({ onDone, onError, onSuccessMessage }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onError("");
    try {
      const res = await fetch(`${getBrowserApiBase()}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email }),
      });
      const body: unknown = await res.json();
      if (!res.ok) {
        onError(formatApiError(body, res.status));
        return;
      }
      const client = body as ClientRow;
      onDone();
      setName("");
      setPhone("");
      setEmail("");
      if (client.syncStatus === "FAILED") {
        onSuccessMessage(
          "Client saved locally but Odoo sync failed — see status below.",
        );
      } else {
        onSuccessMessage("Client created and synced to Odoo.");
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
        <span className="font-medium text-zinc-700">Name</span>
        <input
          required
          className="rounded border border-zinc-300 px-3 py-2 text-zinc-900"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Phone</span>
        <input
          required
          className="rounded border border-zinc-300 px-3 py-2 text-zinc-900"
          value={phone}
          onChange={(ev) => setPhone(ev.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Email</span>
        <input
          required
          type="email"
          className="rounded border border-zinc-300 px-3 py-2 text-zinc-900"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Saving…" : "Create client"}
      </button>
    </form>
  );
}
