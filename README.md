# BanaSync

BanaSync es una aplicación web progresiva (PWA) **offline-first** para supervisores de fincas bananeras. Permite registrar actividades y plagas aun sin conexión, capturar coordenadas GPS, consultar el clima, visualizar focos en un mapa y descargar un reporte semanal en CSV.

El proyecto está organizado como un monorepo npm con dos workspaces:

- `client/`: interfaz React + TypeScript + Vite.
- `server/`: API Express + TypeScript, validación con Zod y almacenamiento temporal en JSON.

## Funcionalidades

- Inicio de sesión local para el flujo de demostración.
- Registro de actividades agrícolas y plagas por lote.
- Clasificación de severidad y captura opcional de ubicación GPS.
- Cola local en IndexedDB para trabajar sin conexión.
- Sincronización idempotente por lotes mediante `POST /api/sync`.
- Indicador de conexión y cantidad de registros pendientes.
- Consulta de pronóstico meteorológico para Finca Indira con caché.
- Mapa SVG de focos de plagas con leyenda por severidad.
- Resumen de los últimos siete días y exportación CSV.
- Diseño responsive: navegación inferior en móvil y barra lateral en escritorio.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Docker Desktop, opcional para levantar PostgreSQL/PostGIS preparado para una fase futura.

## Instalación y desarrollo

```powershell
Copy-Item .env.example .env
npm install
docker compose up -d
npm run dev
```

La aplicación queda disponible en `http://localhost:5173` y la API responde en `http://localhost:3000/api/health`. Para el acceso de demostración se utiliza `usuario` / `usuario123`.

Los comandos se ejecutan desde la raíz:

| Comando | Propósito |
|---|---|
| `npm run dev` | Inicia cliente y servidor en paralelo. |
| `npm run build` | Genera el cliente y el servidor para producción. |
| `npm run typecheck` | Comprueba los tipos de ambos workspaces. |
| `npm run lint` | Ejecuta ESLint en cliente y servidor. |
| `npm test` | Ejecuta las pruebas disponibles. |
| `npm start` | Sirve la aplicación compilada desde Node. |
| `npm run format` | Formatea los archivos con Prettier. |

Para detener los servicios de Docker:

```powershell
docker compose down
```

## API principal

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado de la API. |
| `POST` | `/api/sync` | Valida y sincroniza hasta 50 registros. |
| `GET` | `/api/registros` | Devuelve los registros ordenados por fecha. |
| `GET` | `/api/clima?lat=&lng=` | Consulta el pronóstico para unas coordenadas. |

Los registros se validan con un esquema tipado y se guardan actualmente en `server/data/registros.json`. La integración definitiva con PostgreSQL/PostGIS está preparada en Docker, pero aún no reemplaza este almacenamiento.

## Estructura

```text
client/
  public/              Manifest y service worker de la PWA
  src/main.tsx         Pantallas, estado y lógica del cliente
  src/styles.css       Sistema visual responsive
server/
  src/app.ts           Middlewares y rutas Express
  src/server.ts        Arranque del servidor
  src/tests/            Pruebas de API
docs/
  DECISIONES.md        Decisiones técnicas
  DECISIONES_UI.md     Decisiones de interfaz y accesibilidad
```

## Documentación adicional

- [Guía de desarrollo](./GUIA.md)
- [Decisiones técnicas](./docs/DECISIONES.md)
- [Decisiones de diseño UI](./docs/DECISIONES_UI.md)
- [Archivos editables principales](./ARCHIVOS_EDITABLES.md)

## Producción

```powershell
npm install
npm run build
npm start
```

En producción, Express entrega la web compilada y la API desde el mismo puerto. El hosting puede proporcionar `PORT` mediante las variables de entorno documentadas en `.env.example`.
