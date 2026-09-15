import { Hono } from 'hono';
import { consultar } from '../lib/db.js';
import { clienteDesdeContexto } from '../lib/auth.js';
import { slugificar } from '../lib/slug.js';
import { error } from '../lib/respuestas.js';

const app = new Hono();

async function siteEsDelCliente(c, siteId, clientId) {
  const { rows } = await consultar(c, 'SELECT id FROM sites WHERE id = $1 AND client_id = $2', [siteId, clientId]);
  return !!rows[0];
}

app.get('/', async (c) => {
  const { client_id } = await clienteDesdeContexto(c);
  const siteId = c.req.query('site_id');
  if (!siteId) return error(c, 400, 'Falta site_id.');
  if (!(await siteEsDelCliente(c, siteId, client_id))) return error(c, 404, 'Sitio no encontrado.');

  const { rows } = await consultar(
    c,
    'SELECT id, nombre, slug, orden, created_at FROM pages WHERE site_id = $1 ORDER BY orden ASC, created_at ASC',
    [siteId]
  );
  return c.json({ paginas: rows });
});

app.post('/', async (c) => {
  const { client_id } = await clienteDesdeContexto(c);
  const body = await c.req.json();
  const nombre = String(body.nombre || '').trim();
  if (!body.site_id || !nombre) return error(c, 400, 'Falta site_id o nombre.');
  if (!(await siteEsDelCliente(c, body.site_id, client_id))) return error(c, 404, 'Sitio no encontrado.');

  const { rows: cuenta } = await consultar(c, 'SELECT COUNT(*)::int AS n FROM pages WHERE site_id = $1', [body.site_id]);

  // slug único por sitio (pages tiene UNIQUE(site_id, slug) en Neon).
  const base = slugificar(nombre) || 'pagina';
  let slug = base;
  for (let intento = 2; ; intento++) {
    const { rows: choque } = await consultar(c, 'SELECT 1 FROM pages WHERE site_id = $1 AND slug = $2', [body.site_id, slug]);
    if (!choque[0]) break;
    slug = `${base}-${intento}`;
  }

  const { rows } = await consultar(
    c,
    'INSERT INTO pages (site_id, nombre, slug, orden) VALUES ($1, $2, $3, $4) RETURNING id, nombre, slug, orden, created_at',
    [body.site_id, nombre, slug, cuenta[0].n]
  );
  return c.json({ pagina: rows[0] });
});

export default app;
