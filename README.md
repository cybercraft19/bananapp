w

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

| Comando               | Propósito                                        |
| --------------------- | ------------------------------------------------- |
| `npm run dev`       | Inicia cliente y servidor en paralelo.            |
| `npm run build`     | Genera el cliente y el servidor para producción. |
| `npm run typecheck` | Comprueba los tipos de ambos workspaces.          |
| `npm run lint`      | Ejecuta ESLint en cliente y servidor.             |
| `npm test`          | Ejecuta las pruebas disponibles.                  |
| `npm start`         | Sirve la aplicación compilada desde Node.        |
| `npm run format`    | Formatea los archivos con Prettier.               |

Para detener los servicios de Docker:

```powershell
docker compose down
```

## API principal

| Método  | Ruta                     | Descripción                                   |
| -------- | ------------------------ | ---------------------------------------------- |
| `GET`  | `/api/health`          | Estado de la API.                              |
| `POST` | `/api/sync`            | Valida y sincroniza hasta 50 registros.        |
| `GET`  | `/api/registros`       | Devuelve los registros ordenados por fecha.    |
| `GET`  | `/api/clima?lat=&lng=` | Consulta el pronóstico para unas coordenadas. |

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
  docs/                 Documentación complementaria local
```

## Preguntas frecuentes para la presentación

### ¿Cómo se hizo responsive la página?

Se aplicó un enfoque **mobile-first** con CSS3. En pantallas pequeñas el contenido se apila, los controles ocupan el ancho disponible y la navegación aparece fija en la parte inferior para facilitar el uso con el pulgar. Con un `@media (min-width: 900px)`, la navegación pasa a una barra lateral y el contenido puede distribuirse en dos columnas. La funcionalidad y el orden de las tareas se mantienen; solo cambia la distribución visual.

### ¿Por qué se eligió React, TypeScript y Vite?

React permite construir la interfaz a partir de componentes y actualizar solo el contenido que cambia. TypeScript ayuda a detectar errores en los tipos de registros, severidades y estados antes de ejecutar la aplicación. Vite ofrece un servidor de desarrollo rápido y una compilación optimizada para producción.

### ¿Por qué se usa HTML5 semántico?

La interfaz utiliza elementos según su función: `header` para la cabecera, `nav` para la navegación, `main` para el contenido principal, `section` para grupos de información, `form` para el inicio de sesión, `label` para identificar campos, `button` para acciones y `table` para el reporte. Esto mejora la accesibilidad, la navegación con teclado y la interpretación por lectores de pantalla.

### ¿Cómo se aplicaron los estilos CSS3?

Los estilos se centralizan en `client/src/styles.css` mediante variables CSS para fondo, superficies, texto, color principal, advertencias y errores. Se usan Grid para organizar tarjetas y columnas, Flexbox para alinear controles, bordes redondeados para agrupar visualmente la información y media queries para adaptar el layout.

### ¿Por qué se eligieron esos colores?

El verde representa la acción principal y se relaciona con el contexto agrícola. Los tonos amarillos comunican advertencia o falta de conexión y los tonos rojos indican error o severidad alta. Los estados también llevan texto e iconos, por lo que la información no depende solamente del color.

### ¿Cómo funciona el responsable de cada registro?

El responsable se obtiene del usuario que inicia sesión. Después del login se muestra como un valor no editable y se guarda automáticamente en cada registro. De esta manera se evita que una persona cambie manualmente la autoría de una actividad durante la revisión del lote.

### ¿Cómo funciona el modo offline?

Cada registro se guarda primero en IndexedDB, que es el almacenamiento local del navegador. Si no hay conexión, queda marcado como pendiente. Cuando vuelve la conexión, el cliente envía los registros a la API mediante `POST /api/sync` y actualiza su estado a enviado.

### ¿Cómo se evita duplicar registros al sincronizar?

Cada registro recibe un UUID. El servidor usa ese identificador como clave y solo agrega registros que todavía no existen. Por eso, si el cliente reintenta enviar un registro debido a una mala conexión, el servidor no crea una copia.

### ¿Cómo se validan los datos?

La API valida el cuerpo de las solicitudes con Zod: tipo de registro, lote, detalle, severidad, coordenadas, responsable y fecha. Si los datos no cumplen las reglas, responde con HTTP 400 y un mensaje de error estructurado.

### ¿Cómo se implementó el mapa?

El mapa actual usa SVG para representar el área de la finca y dibujar los focos de plaga que tienen coordenadas GPS. Los colores distinguen la severidad y la leyenda agrega texto. Se eligió esta solución porque es liviana y suficiente para el alcance actual; una integración con Leaflet queda como evolución futura.

### ¿Cómo se implementó la PWA?

El `manifest.webmanifest` define el nombre BanaSync, el idioma, los colores y el modo standalone. El service worker almacena recursos de la aplicación y permite recuperar la interfaz cuando no hay red. Los datos de negocio se manejan por separado con IndexedDB y sincronización posterior.

### ¿Qué limitaciones tiene esta versión?

El login es local y de demostración, no un sistema de autenticación de producción. Los registros se almacenan temporalmente en un archivo JSON del servidor; PostgreSQL/PostGIS está preparado en Docker para una siguiente fase. El mapa es una representación SVG, no un mapa cartográfico con teselas.

### ¿Cómo se podría mejorar el proyecto?

Se podría incorporar autenticación real con sesiones o tokens, permisos por rol, PostgreSQL/PostGIS, migraciones de base de datos, un mapa cartográfico, pruebas de componentes, auditoría de cambios y una cola de sincronización más completa.

## Producción

```powershell
npm install
npm run build
npm start
```

En producción, Express entrega la web compilada y la API desde el mismo puerto. El hosting puede proporcionar `PORT` mediante las variables de entorno documentadas en `.env.example`.
