import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  SERVER_PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  CLIMA_CACHE_TTL_MIN: z.coerce.number().positive().default(45),
  OPEN_METEO_BASE_URL: z.string().url().default("https://api.open-meteo.com/v1/forecast")
});

export const env = envSchema.parse(process.env);
