import "dotenv/config";

import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { isHttpError } from "./lib/http-error.js";
import { clientsRouter } from "./modules/clients/clients.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";

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
app.use(
  cors({
    origin: env.WEB_ORIGIN ?? ["http://localhost:3000", "http://127.0.0.1:3000"],
  }),
);

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
