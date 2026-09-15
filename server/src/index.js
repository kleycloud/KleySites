import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { crearClienteDB } from './lib/db.js';
import { ErrorAutenticacion } from './lib/auth.js';

import registro from './rutas/registro.js';
import login from './rutas/login.js';
import confirmar from './rutas/confirmar.js';
import enviarCodigo from './rutas/enviarCodigo.js';
import googleLogin from './rutas/googleLogin.js';
import perfil from './rutas/perfil.js';
import perfilNombre from './rutas/perfilNombre.js';
import perfilAvatar from './rutas/perfilAvatar.js';
import sites from './rutas/sites.js';
import sitesFavicon from './rutas/sitesFavicon.js';
import sitesThumbnail from './rutas/sitesThumbnail.js';
import pages from './rutas/pages.js';
import blocks from './rutas/blocks.js';
import publish from './rutas/publish.js';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: (_origin, c) => c.env.KLEYSITES_FRONTEND_ORIGIN || '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Un Client de `pg` por request (ver lib/db.js) — se abre acá, no en
// cada ruta, y se cierra siempre al terminar, haya ido bien o mal.
app.use('*', async (c, next) => {
  const client = await crearClienteDB(c.env);
  c.set('db', client);
  try {
    await next();
  } finally {
    await client.end();
  }
});

app.onError((err, c) => {
  if (err instanceof ErrorAutenticacion) return c.json({ error: 'Sesión inválida o expirada.' }, 401);
  console.error(err);
  return c.json({ error: 'Error interno. Intenta de nuevo.' }, 500);
});

app.route('/api/kleysites/registro', registro);
app.route('/api/kleysites/login', login);
app.route('/api/kleysites/confirmar', confirmar);
app.route('/api/kleysites/enviar-codigo', enviarCodigo);
app.route('/api/kleysites/google-login', googleLogin);
app.route('/api/kleysites/perfil/nombre', perfilNombre);
app.route('/api/kleysites/perfil/avatar', perfilAvatar);
app.route('/api/kleysites/perfil', perfil);
app.route('/api/kleysites/sites/favicon', sitesFavicon);
app.route('/api/kleysites/sites/thumbnail', sitesThumbnail);
app.route('/api/kleysites/sites', sites);
app.route('/api/kleysites/pages', pages);
app.route('/api/kleysites/blocks', blocks);
app.route('/api/kleysites/publish', publish);

export default app;
