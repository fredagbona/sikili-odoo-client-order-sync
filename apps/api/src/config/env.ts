import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  ODOO_URL: z.string().min(1),
  ODOO_DB: z.string().min(1),
  ODOO_USERNAME: z.string().min(1),
  ODOO_PASSWORD: z.string().min(1),
  WEB_ORIGIN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
