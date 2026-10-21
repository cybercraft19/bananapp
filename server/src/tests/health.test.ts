import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app.js";

const reg = {
  id: "f3b1c2a0-9d1e-4c55-8a41-0b7f6c3d2e10", tipo: "plaga", lote: "L-07", detalle: "Sigatoka negra",
  severidad: "media", lat: 7.93, lng: -76.69, responsable: "Ana", creado: "2026-10-15T09:42:10-05:00"
};

describe("API", () => {
  it("expone el estado de la API", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });
  it("sincroniza sin duplicar (idempotente)", async () => {
    await request(app).post("/api/sync").send({ registros: [reg] }).expect(200);
    const r = await request(app).post("/api/sync").send({ registros: [reg] }).expect(200);
    expect(r.body.aceptados).toEqual([reg.id]);
    const l = await request(app).get("/api/registros");
    expect(l.body.registros.filter((x: { id: string }) => x.id === reg.id)).toHaveLength(1);
  });
  it("rechaza registros inválidos", async () => {
    await request(app).post("/api/sync").send({ registros: [{ id: "x" }] }).expect(400);
  });
});
