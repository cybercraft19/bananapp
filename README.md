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

La implementación actual corresponde a la Fase 0: estructura del monorepo, configuración, servidor mínimo, cliente PWA mínimo y servicio PostGIS. Las migraciones, autenticación, sincronización y flujos de campo se incorporarán en las fases siguientes.

Consulta [GUIA.md](./GUIA.md) para el flujo de desarrollo y [docs/DECISIONES.md](./docs/DECISIONES.md) para las decisiones tomadas.
