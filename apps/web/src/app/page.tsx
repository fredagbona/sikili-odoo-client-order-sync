import { Dashboard } from "./dashboard";
import { serverFetchClients, serverFetchOrders } from "@/lib/api";

export default async function Home() {
  const [initialClients, initialOrders] = await Promise.all([
    serverFetchClients(),
    serverFetchOrders(),
  ]);
  return (
    <main className="min-h-full flex-1 bg-zinc-50">
      <Dashboard
        initialClients={initialClients}
        initialOrders={initialOrders}
      />
    </main>
  );
}
