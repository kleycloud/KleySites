# Contribuir a KleySites

Gracias por el interés. Esta guía cubre cómo levantar el proyecto según
qué parte vayas a tocar, y las convenciones que seguimos.

## Solo frontend/editor (lo más común)

No hace falta ninguna cuenta ni backend real: los tests mockean toda la
red con `page.route()`, y el editor/dashboard corren igual sin sesión
real para navegar la UI.

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # Playwright — 65 specs, no necesita el backend
```

## Si vas a tocar el backend o probar el flujo completo (login real, publicar, etc.)

Hace falta tu propia infraestructura — no es "clonar y listo", KleySites
depende de varios servicios externos. Ninguno cuesta para desarrollo:

1. **[Neon](https://neon.tech)** (Postgres, plan gratis) — creá un
   proyecto y corré `server/db/migration.sql` en su SQL Editor.
2. **[Cloudflare](https://dash.cloudflare.com)** (cuenta gratis) — para
   Workers (el backend), Pages (publicar sitios de prueba) e Hyperdrive
   (conexión a Neon). Setup completo en
   [server/README.md](server/README.md).
3. **[Cloudinary](https://cloudinary.com)** (plan gratis) — para fotos
   de perfil/favicons. Creá un "upload preset" sin firmar (Settings →
   Upload → Upload presets → Signing Mode: **Unsigned**).
4. **[Google Cloud Console](https://console.cloud.google.com)** — un
   OAuth Client ID tipo "Web application", solo si vas a probar
   "Continuar con Google" (el login por correo con código no lo
   necesita).

Con eso:

```bash
cp .env.example .env.local              # completar con tus valores
cp server/.dev.vars.example server/.dev.vars   # completar con los tuyos

cd server && npm install && npm run dev # backend, ver su README para Hyperdrive local
# en otra terminal, desde la raíz:
npm install && npm run dev              # frontend, ya toma .env.local solo
```

Sin `.env.local`, el frontend arranca igual apuntando a la infraestructura
real de KleySites — útil para navegar la UI, no para probar un flujo de
cuenta propio.

## Convenciones del proyecto

- **Módulos chicos**: cada archivo, una sola responsabilidad. Si un
  archivo empieza a superar ~200 líneas o a mezclar cosas, se separa.
  Ver `src/js/editor/*.js` o `server/src/rutas/*.js` como ejemplo.
- **Sin librerías de íconos en runtime**: los SVG van a mano, inline. Si
  el ícono viene de Lucide, se copia su `path` real (fuente en
  `node_modules/lucide-static` si está instalada como dev dependency),
  nunca se agrega la librería como dependencia de producción.
- **Nada de colores/tamaños sueltos**: todo sale de
  `src/styles/theme.css` / `kley-tokens.css`. Un componente nuevo no
  inventa un color, referencia un token existente o agrega uno nuevo ahí.
- **No fabricar datos ni funciones que no existen de verdad**: si algo
  no está implementado (ej. envío real de correo), se muestra un
  "Próximamente" honesto o se omite — nunca una UI que simula que algo
  funciona cuando no lo hace.
- **Un solo renderizador**: `src/js/render/` es la única fuente de
  verdad para convertir bloques en HTML — lo usan el lienzo del editor,
  Vista previa, Exportar y Publicar por igual. Un cambio de renderizado
  se hace ahí, nunca duplicado en otro lado.

## Tests

```bash
npm test                    # todos
npx playwright test <archivo>   # uno solo
npx playwright show-report      # ver el último reporte
```

Cada spec nuevo sigue el patrón de `tests/fixtures.js` (fixture `sesion`
con token falso) y mockea la red — evitar que un test dependa de
infraestructura real.

## Licencia

[GNU AGPL v3](LICENSE) — podés ver el código, correrlo, modificarlo y
usarlo en producción para tus propios sitios o los de tus clientes,
gratis, sin pedir permiso. La única condición: si corrés una versión
modificada como servicio en red (por ejemplo, tu propio "website
builder" hosteado), tenés que publicar el código de tus cambios bajo la
misma licencia — no podés tomar el código, mejorarlo en privado, y
competir con eso.
automáticamente — mismo modelo que usan Sentry o CockroachDB.
