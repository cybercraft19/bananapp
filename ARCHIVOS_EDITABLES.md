# Archivos editables principales

Este documento indica dónde modificar cada parte principal de BananApp. Las rutas son relativas a la carpeta raíz `bananApp_Test`.

## Cliente web

| Área | Archivo o carpeta | Qué se edita |
|---|---|---|
| Punto de entrada y pantalla actual | `client/src/main.tsx` | Renderizado inicial de React, contenido visible y estructura de la pantalla principal. |
| Estilos globales | `client/src/styles.css` | Colores, tipografía, tamaños, espaciado, botones y diseño responsive. |
| HTML base | `client/index.html` | Título, idioma, metadatos y punto de montaje de React. |
| Configuración de Vite | `client/vite.config.ts` | Puerto, plugins y configuración del servidor de desarrollo. |
| Pruebas del cliente | `client/src/tests/` | Pruebas unitarias y de interfaz del cliente. |

En las siguientes fases, las funcionalidades del cliente deben organizarse dentro de `client/src/features/`, los componentes reutilizables dentro de `client/src/components/ui/` y la navegación dentro de `client/src/app/`.

## Servidor API

| Área | Archivo o carpeta | Qué se edita |
|---|---|---|
| Aplicación Express | `server/src/app.ts` | Middlewares, rutas HTTP y configuración general de Express. |
| Arranque del servidor | `server/src/server.ts` | Puerto y proceso de escucha de la API. |
| Variables de entorno | `server/src/config/env.ts` | Validación y lectura tipada de variables de entorno. |
| Pruebas del servidor | `server/src/tests/` | Pruebas unitarias y de integración de la API. |
| Rutas HTTP | `server/src/routes/` | Definición de endpoints; los controladores se conectan aquí. |
| Controladores | `server/src/controllers/` | Traducción entre HTTP y la lógica de negocio. |
| Servicios | `server/src/services/` | Reglas de negocio y casos de uso. |
| Repositorios | `server/src/repositories/` | Consultas SQL y acceso a PostgreSQL/PostGIS. |
| Eventos | `server/src/events/` | Bus de eventos y reacciones internas del servidor. |

## Base de datos

| Área | Archivo o carpeta | Qué se edita |
|---|---|---|
| Migraciones | `database/migrations/` | Cambios versionados y reversibles del esquema PostgreSQL/PostGIS. |
| Datos iniciales | `database/seeds/` | Finca Indira, lotes, usuarios y datos de demostración. |
| Servicio de base de datos | `docker-compose.yml` | Imagen, puerto, credenciales por defecto y volumen de PostgreSQL. |

## Configuración y documentación

| Archivo | Qué se edita |
|---|---|
| `.env` | Valores locales; no debe compartirse ni versionarse. |
| `.env.example` | Lista documentada de variables necesarias para otros desarrolladores. |
| `package.json` | Workspaces y comandos globales del proyecto. |
| `client/package.json` | Dependencias y comandos del cliente. |
| `server/package.json` | Dependencias y comandos del servidor. |
| `README.md` | Resumen, requisitos e inicio rápido. |
| `GUIA.md` | Procedimiento de instalación y desarrollo. |
| `docs/DECISIONES.md` | Decisiones técnicas y razones de implementación. |
| `ARCHIVOS_EDITABLES.md` | Este índice de archivos principales. |

## Comandos habituales

Desde `bananApp_Test`:

```powershell
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
docker compose up -d
```

La aplicación cliente se abre en `http://localhost:5173` y la comprobación de la API está disponible en `http://localhost:3000/api/health`.
