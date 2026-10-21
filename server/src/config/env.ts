import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  SERVER_PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);
