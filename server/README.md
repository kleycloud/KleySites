# Backend (Next.js)

API-only: no sirve páginas, solo `/api/kleysites/*`. Reemplaza a n8n — el
frontend (Vite, en la raíz del repo) es un sitio estático aparte, solo le
apunta por `src/js/api.js`/`auth.js` (`VITE_API_BASE`).

En producción: backend en Vercel (`kleysites-api.vercel.app`), frontend
en Cloudflare Pages (`kleysites.pages.dev`), base de datos en Neon.

## Arrancar en local

```
cd server
npm install
cp .env.example .env.local   # completar con los valores reales (ver abajo)
npm run dev                  # http://localhost:3001
```

En la raíz del repo, para que el frontend local hable con este backend
local en vez del de producción:

```
VITE_API_BASE=http://localhost:3001/api npm run dev
```

## Variables de entorno

Ver `.env.example`. `DATABASE_URL` y `KLEYSITES_JWT_SECRET` son
imprescindibles para cualquier endpoint; `CLOUDFLARE_*` solo hace falta
para `/publish`; `GOOGLE_CLIENT_ID_WEB` solo para login con Google.

## Deploy

```
cd server
vercel deploy --prod
```

Las variables de entorno de producción ya están cargadas en el proyecto
de Vercel (`vercel env add <nombre> production`) — no hace falta
recargarlas en cada deploy, solo si cambia algún valor.

## Publicar sitios (Cloudflare Pages)

`/publish` genera el HTML del sitio y lo sube con Wrangler CLI (no la
API de "Direct Upload" directa — esa da errores intermitentes, ya
comprobado antes en n8n). Dos detalles de por qué está armado así en
`lib/cloudflarePages.js`:

- Se invoca `node node_modules/wrangler/bin/wrangler.js` en vez del
  symlink `.bin/wrangler`, porque el tracer de archivos de Vercel no
  empaqueta symlinks a los que solo se llega por un path armado en
  runtime.
- `next.config.js` fuerza a incluir `node_modules/**` entero para esta
  ruta (`outputFileTracingIncludes`) — Wrangler carga dependencias
  (miniflare, workerd) que el tracer no detecta solo.
- El `cwd` del proceso de Wrangler es el directorio temporal del deploy,
  no `process.cwd()` — en Vercel `process.cwd()` es de solo lectura y
  Wrangler necesita crear ahí su carpeta de caché.

## Lo que falta

- Envío de correo real (código de verificación / passwordless) — los
  endpoints generan el código y lo guardan, pero no lo envían todavía.
- Migrar el backend fuera de Vercel si en algún momento se prefiere no
  depender de él (nada en el código lo exige — es la config de
  `next.config.js`/`vercel.json` la que asume ese runtime).
