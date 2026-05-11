import { Router, type IRouter } from "express";
import { z } from "zod";

import { isHttpError } from "../../lib/http-error.js";
import { createOrder, listOrders } from "./orders.service.js";

const createBodySchema = z.object({
  clientId: z.string().min(1),
  productName: z.string().min(1),
  amount: z.number().finite().positive(),
});

export const ordersRouter: IRouter = Router();

ordersRouter.get("/", async (_req, res, next) => {
  try {
    const orders = await listOrders();
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

ordersRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const order = await createOrder(parsed.data);
    res.status(201).json(order);
  } catch (e) {
    if (isHttpError(e)) {
      res.status(e.statusCode).json({ error: e.message });
      return;
    }
    next(e);
  }
});
