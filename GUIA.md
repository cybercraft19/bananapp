# Guía de desarrollo

## Variables de entorno

Duplica `.env.example` como `.env`. El archivo `.env` es local y no debe versionarse.

## Comandos

```powershell
npm install
docker compose up -d
npm run dev
```

Para detener la base de datos:

```powershell
docker compose down
```

El servidor expone `GET /api/health` y el cliente se sirve en el puerto 5173. En esta fase no se requiere una base de datos para arrancar la API; PostGIS queda preparado para la Fase 1.

Si `docker` no está disponible en PowerShell, instala e inicia Docker Desktop y vuelve a ejecutar `docker compose up -d`.
