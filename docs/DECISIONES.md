# Decisiones técnicas

## Fase 0

### Monorepo npm con workspaces

Se usa un `package.json` raíz con workspaces `client` y `server`. Esto mantiene un único flujo de instalación y comandos, sin introducir una herramienta adicional de monorepo.

### Vite para el cliente

Vite permite un arranque rápido y es el bundler definido por los requisitos. La configuración deja preparado `vite-plugin-pwa` para la siguiente fase de interfaz/PWA.

### Docker Compose para PostGIS

La imagen oficial `postgis/postgis` fija PostgreSQL 16 y PostGIS 3.x, con volumen persistente y healthcheck. Las credenciales de desarrollo provienen de `.env`.

### Alcance de esta entrega

Se implementa únicamente la Fase 0. No se agregan migraciones ni endpoints de dominio antes de validar que la infraestructura arranca correctamente.
