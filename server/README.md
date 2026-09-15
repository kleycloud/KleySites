# Backend (Cloudflare Workers)

API-only: no sirve páginas, solo `/api/kleysites/*`. El frontend (Vite,
en la raíz del repo) es un sitio estático aparte, solo le apunta por
`src/js/api.js`/`auth.js` (`VITE_API_BASE`).

En producción: backend en Cloudflare Workers
(`kleysites-api.testadsj.workers.dev`), frontend en Cloudflare Pages
(`kleysites.pages.dev`), base de datos en Neon (vía Hyperdrive).

Framework: [Hono](https://hono.dev). Cada endpoint es un archivo chico
en `src/rutas/`, montado desde `src/index.js`.

## Arrancar en local

```
cd server
npm install
cp .dev.vars.example .dev.vars   # completar con los valores reales
npm run dev                       # http://localhost:8787
```

Para que `wrangler dev` conecte a Neon real (no solo simule Hyperdrive),
hace falta además exportar en el shell (no funciona puesto en
`.dev.vars` — ver el comentario en `.dev.vars.example`):

```
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgresql://..."
```

En la raíz del repo, para que el frontend local hable con este backend
local en vez del de producción:

```
VITE_API_BASE=http://localhost:8787/api npm run dev
```

## Variables de entorno

Ver `.dev.vars.example`. `KLEYSITES_JWT_SECRET` es imprescindible para
cualquier endpoint autenticado; `CLOUDFLARE_ACCOUNT_ID`/
`CLOUDFLARE_API_TOKEN` solo hace falta para `/publish`;
`GOOGLE_CLIENT_ID_WEB` solo para login con Google. La conexión a Neon no
es una variable de entorno del Worker — es el binding de Hyperdrive
(`wrangler.jsonc`).

## Deploy

```
cd server
npm run deploy
```

Los secrets de producción se cargan una sola vez (no hace falta
recargarlos en cada deploy, solo si cambia algún valor):

```
echo -n "valor" | npx wrangler secret put NOMBRE_DE_LA_VARIABLE
```

## Publicar sitios (Cloudflare Pages)

El backend **no renderiza nada**: el frontend genera el sitio completo
(`src/js/render/` — el mismo código del lienzo, la vista previa y el ZIP
de Exportar) y `/publish` recibe `{ site_id, archivos: [{ nombre,
contenido }] }`, valida (solo `.html/.json/.txt` planos, ≤ 50 archivos,
≤ 5 MB, `index.html` obligatorio, sitio del cliente) y lo sube por la
API "Direct Upload" de Cloudflare Pages — el mismo protocolo que usa
Wrangler internamente (verificado leyendo su código fuente), no la API
"ingenua" de un solo POST que había dado problemas antes.

Detalle no obvio, documentado en `src/lib/hashBlake3.js` y
`src/lib/cloudflarePages.js`: el hash de cada archivo para el manifest
es `BLAKE3(base64(contenido) + extensión).hex().slice(0, 32)`, no
SHA-256 ni MD5. Y `blake3-wasm` no tiene un build pensado para Workers,
así que el `.wasm` se importa directo como módulo ES en vez de dejar que
la librería lo cargue sola (su build "node" usa `fs.readFileSync`, que
no existe en Workers).

## Lo que falta

- Envío de correo real (código de verificación / passwordless) — los
  endpoints generan el código y lo guardan, pero no lo envían todavía.
