# KleySites

Builder visual de páginas web open source — crea y publica tu sitio sin complicaciones.
Powered by [KleyCloud](https://kleyderproject.cloud).

## Stack

- **Frontend**: HTML + CSS + JS puro (ES Modules), sin frameworks pesados
- **Build tool**: [Vite](https://vitejs.dev)
- **Backend**: n8n (webhooks) + Neon (PostgreSQL)
- **Hosting**: Cloudflare Pages (deploy automático desde este repo)
- **Publicación de sitios de clientes**: Wrangler + SSH desde el VPS (proceso aparte, no pasa por este repo)

## Estructura

```
├── index.html              # entrada (login)
├── public/                 # assets estáticos (favicons, manifest, imágenes)
│   └── images/
├── src/
│   ├── styles/
│   │   ├── kley-tokens.css   # tokens del manual de marca (Claude Design) — fuente de verdad
│   │   ├── theme.css         # alias semánticos sobre los tokens (colores, tipografía, espaciado)
│   │   ├── layout.css        # estructura general (contenedores, grillas)
│   │   ├── components.css    # piezas reutilizables (botones, inputs, mensajes)
│   │   └── login.css         # estilos específicos de la pantalla de login
│   └── js/
│       └── auth.js           # lógica de login/registro (passwordless + Google)
└── vite.config.js
```

**Regla del proyecto**: nunca se escriben colores, tamaños o tipografías sueltas
directamente en un componente. Todo se referencia desde `theme.css`/`kley-tokens.css`.

## Desarrollo local

```bash
npm install
npm run dev       # levanta el servidor local con recarga en vivo
npm run build     # genera /dist listo para producción
```

## Deploy

Cloudflare Pages está conectado directamente a este repositorio. Cada push a `main`
dispara un build y deploy automático — no hace falta subir archivos a mano.
