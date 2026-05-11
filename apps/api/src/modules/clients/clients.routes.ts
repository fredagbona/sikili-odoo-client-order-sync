import { Router, type IRouter } from "express";
import { z } from "zod";

import { createClient, listClients } from "./clients.service.js";

const createBodySchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
});

export const clientsRouter: IRouter = Router();

clientsRouter.get("/", async (_req, res, next) => {
  try {
    const clients = await listClients();
    res.json(clients);
  } catch (e) {
    next(e);
  }
});

clientsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const client = await createClient(parsed.data);
    res.status(201).json(client);
  } catch (e) {
    next(e);
  }
});
