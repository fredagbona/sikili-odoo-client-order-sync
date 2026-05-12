import "dotenv/config";

import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { isHttpError } from "./lib/http-error.js";
import { clientsRouter } from "./modules/clients/clients.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";

const defaultBrowserOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function corsAllowedOrigins(): string | string[] {
  const raw = env.WEB_ORIGIN?.trim();
  if (!raw) return defaultBrowserOrigins;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return defaultBrowserOrigins;
  if (parts.length === 1) return parts[0]!;
  return parts;
}

const corsOrigin = corsAllowedOrigins();
console.log(
  "[CORS] allowed origins:",
  Array.isArray(corsOrigin) ? corsOrigin.join(", ") : corsOrigin,
);

const app = express();

app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    console.log(
      `[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`,
    );
  });
  next();
});

app.use(express.json());
app.use(cors({ origin: corsOrigin }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/clients", clientsRouter);
app.use("/orders", ordersRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (isHttpError(err)) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

app.listen(env.API_PORT, "0.0.0.0", () => {
  console.log(`API listening on port ${env.API_PORT}`);
});
