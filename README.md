# BananApp

PWA offline-first para supervisores de fincas bananeras. El proyecto se organiza como un monorepo npm con un cliente React/Vite y un servidor Express/TypeScript.

## Requisitos

- Node.js 20+
- npm 10+
- Docker Desktop (para PostgreSQL + PostGIS)

## Inicio rápido

```powershell
Copy-Item .env.example .env
npm install
docker compose up -d
npm run dev
```

- Cliente: http://localhost:5173
- API: http://localhost:3000/api/health

Los comandos `npm run typecheck`, `npm run lint`, `npm test` y `npm run build` ejecutan la verificación de ambos workspaces.

## Estado por fases

Estado actual: cliente PWA funcional (registro de actividades y plagas con GPS, mapa, reporte semanal CSV, clima) con cola offline en IndexedDB y sincronización idempotente (`POST /api/sync`). El servidor guarda en `server/data/registros.json`; PostgreSQL/PostGIS, autenticación y Leaflet quedan para la siguiente fase.

Consulta [GUIA.md](./GUIA.md) para el flujo de desarrollo y [docs/DECISIONES.md](./docs/DECISIONES.md) para las decisiones tomadas.

## Producción (un solo servidor Node)

```bash
npm install && npm run build && npm start
```

El servidor entrega la web compilada y la API en el mismo puerto (usa `PORT` si el hosting lo define).
