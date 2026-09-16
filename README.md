# KleySites

Builder visual de páginas web open source — crea y publica tu sitio sin complicaciones.
Powered by [KleyCloud](https://kleyderproject.cloud).

Copyright (C) 2026 KleyCloud. Licenciado bajo [GNU AGPL v3](LICENSE): podés ver, correr,
modificar y redistribuir el código libremente. Si corrés una versión modificada como
servicio en red (por ejemplo, tu propio "website builder" hosteado), tenés que publicar
el código de tus cambios bajo la misma licencia.

## Stack

- **Frontend**: HTML + CSS + JS puro (ES Modules), sin frameworks pesados
- **Build tool**: [Vite](https://vitejs.dev)
- **Backend**: Cloudflare Workers (Hono) en `server/` + Neon (PostgreSQL, vía Hyperdrive) — ver [server/README.md](server/README.md)
- **Hosting frontend**: Cloudflare Pages (`kleysites.pages.dev`)
- **Hosting backend**: Cloudflare Workers (`kleysites-api.testadsj.workers.dev`)
- **Publicación de sitios de clientes**: el frontend genera el sitio completo (`src/js/render/`, el único renderizador: lienzo, vista previa, ZIP y publicado salen del mismo código) y el backend lo despliega con Wrangler a su propio proyecto de Cloudflare Pages. **Exportar** descarga esos mismos archivos como ZIP para publicarlos a mano en cualquier hosting.
- **Formato de intercambio**: [docs/formato-kleysites.md](docs/formato-kleysites.md) — el JSON que exporta e importa el editor (sirve para pedirle una página a Claude y editarla en KleySites)

## Estructura

```
├── index.html, dashboard.html, editor.html   # las 3 páginas de la app
├── public/                 # assets estáticos (favicons, manifest, imágenes)
├── src/
│   ├── styles/              # theme.css/kley-tokens.css son la fuente de verdad de diseño
│   └── js/
│       ├── api.js            # cliente del backend (sesión, sitios, bloques)
│       ├── auth.js           # login/registro (passwordless + Google) en index.html
│       └── editor/           # lógica del editor visual, un archivo por responsabilidad
├── tests/                   # Playwright, mockea el backend con page.route()
├── server/                  # backend (Cloudflare Workers) — ver server/README.md
└── vite.config.js
```

**Regla del proyecto**: nunca se escriben colores, tamaños o tipografías sueltas
directamente en un componente. Todo se referencia desde `theme.css`/`kley-tokens.css`.
Los archivos se mantienen chicos y con una sola responsabilidad — de ahí que el
editor esté dividido en `src/js/editor/*.js` en vez de un solo archivo.

## Desarrollo local

```bash
npm install
npm run dev       # levanta el servidor local con recarga en vivo
npm run build     # genera /dist listo para producción
npm test          # Playwright (no necesita el backend corriendo)
```

Backend: ver [server/README.md](server/README.md).

¿Querés contribuir o correr el proyecto completo con tu propia infraestructura
(base de datos, backend, login con Google)? Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Deploy

Ninguno de los dos (frontend ni backend) tiene integración git automática todavía
— ambos se publican a mano:

```bash
# Frontend -> Cloudflare Pages
npm run build
npx wrangler pages deploy dist --project-name=kleysites

# Backend -> Cloudflare Workers
cd server && npm run deploy
```
