import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "bananapp-api" });
});

app.use((_request, response) => {
  response.status(404).json({
    error: { codigo: "NO_ENCONTRADO", mensaje: "Ruta no encontrada", detalles: [] }
  });
});
