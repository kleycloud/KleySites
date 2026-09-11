# KleySites

Builder visual de páginas web open source — crea y publica tu sitio sin complicaciones.
Powered by [KleyCloud](https://kleyderproject.cloud).

## Stack

- **Frontend**: HTML + CSS + JS puro (ES Modules), sin frameworks pesados
- **Build tool**: [Vite](https://vitejs.dev)
- **Backend**: Next.js (API routes) en `server/` + Neon (PostgreSQL) — ver [server/README.md](server/README.md)
- **Hosting frontend**: Cloudflare Pages (`kleysites.pages.dev`)
- **Hosting backend**: Vercel (`kleysites-api.vercel.app`)
- **Publicación de sitios de clientes**: el backend corre Wrangler para desplegar cada sitio a su propio proyecto de Cloudflare Pages

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
├── server/                  # backend (Next.js) — ver server/README.md
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
npm test          # Playwright (42 specs, no necesita el backend corriendo)
```

Backend: ver [server/README.md](server/README.md).

## Deploy

Ninguno de los dos (frontend ni backend) tiene integración git automática todavía
— ambos se publican a mano:

```bash
# Frontend -> Cloudflare Pages
VITE_API_BASE=https://kleysites-api.vercel.app/api npm run build
npx wrangler pages deploy dist --project-name=kleysites

# Backend -> Vercel
cd server && vercel deploy --prod
```
