import cors from "cors";
import express from "express";
import helmet from "helmet";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { env } from "./config/env.js";

export const app = express();
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: "256kb" }));

// Almacén simple en archivo JSON (reemplazable por PostgreSQL/PostGIS en la Fase 1).
const ARCHIVO = process.env.DATA_FILE ?? path.resolve(process.cwd(), "data", "registros.json");
const registroSchema = z.object({
  id: z.string().uuid(),
  tipo: z.enum(["actividad", "plaga"]),
  lote: z.string().min(1).max(10),
  detalle: z.string().min(1).max(200),
  severidad: z.enum(["baja", "media", "alta"]).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  responsable: z.string().min(1).max(80),
  creado: z.string().datetime({ offset: true })
});
type Registro = z.infer<typeof registroSchema>;

const registros = new Map<string, Registro>();
try {
  for (const r of JSON.parse(fs.readFileSync(ARCHIVO, "utf8")) as Registro[]) registros.set(r.id, r);
} catch { /* primer arranque */ }
const guardar = () => {
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  fs.writeFileSync(ARCHIVO, JSON.stringify([...registros.values()]));
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "bananapp-api" });
});

// Sincronización idempotente: el UUID evita duplicados en reenvíos.
app.post("/api/sync", (req, res) => {
  const parsed = z.object({ registros: z.array(registroSchema).max(50) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { codigo: "DATOS_INVALIDOS", mensaje: "Registros inválidos", detalles: parsed.error.issues } });
    return;
  }
  for (const r of parsed.data.registros) if (!registros.has(r.id)) registros.set(r.id, r);
  guardar();
  res.json({ aceptados: parsed.data.registros.map((r) => r.id) });
});

app.get("/api/registros", (_req, res) => {
  res.json({ registros: [...registros.values()].sort((a, b) => b.creado.localeCompare(a.creado)) });
});

// Clima con caché en servidor: una consulta externa por finca cada TTL minutos.
const climaCache = new Map<string, { t: number; data: unknown }>();
app.get("/api/clima", async (req, res) => {
  const q = z.object({ lat: z.coerce.number().min(-90).max(90), lng: z.coerce.number().min(-180).max(180) }).safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: { codigo: "DATOS_INVALIDOS", mensaje: "lat y lng requeridos", detalles: [] } });
    return;
  }
  const clave = `${q.data.lat.toFixed(2)},${q.data.lng.toFixed(2)}`;
  const hit = climaCache.get(clave);
  if (hit && Date.now() - hit.t < env.CLIMA_CACHE_TTL_MIN * 60_000) {
    res.json({ ...(hit.data as object), cache: true });
    return;
  }
  try {
    const url = `${env.OPEN_METEO_BASE_URL}?latitude=${q.data.lat}&longitude=${q.data.lng}&daily=precipitation_sum,temperature_2m_max&timezone=America/Bogota`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as { daily: { time: string[]; precipitation_sum: number[]; temperature_2m_max: number[] } };
    const data = { dias: j.daily.time.map((f, i) => ({ fecha: f, lluvia_mm: j.daily.precipitation_sum[i], tmax: j.daily.temperature_2m_max[i] })) };
    climaCache.set(clave, { t: Date.now(), data });
    res.json({ ...data, cache: false });
  } catch {
    if (hit) { res.json({ ...(hit.data as object), cache: true, antiguo: true }); return; }
    res.status(502).json({ error: { codigo: "CLIMA_NO_DISPONIBLE", mensaje: "No se pudo consultar el clima", detalles: [] } });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: { codigo: "NO_ENCONTRADO", mensaje: "Ruta no encontrada", detalles: [] } });
});
