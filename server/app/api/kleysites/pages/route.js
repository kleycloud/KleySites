import { consultar } from '../../../../lib/db.js';
import { clienteDesdeRequest } from '../../../../lib/auth.js';
import { slugificar } from '../../../../lib/slug.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../lib/respuestas.js';

export const OPTIONS = opciones;

async function siteEsDelCliente(siteId, clientId) {
  const { rows } = await consultar('SELECT id FROM sites WHERE id = $1 AND client_id = $2', [siteId, clientId]);
  return !!rows[0];
}

export const GET = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const siteId = new URL(req.url).searchParams.get('site_id');
  if (!siteId) return error(400, 'Falta site_id.');
  if (!(await siteEsDelCliente(siteId, client_id))) return error(404, 'Sitio no encontrado.');

  const { rows } = await consultar(
    'SELECT id, nombre, slug, orden, created_at FROM pages WHERE site_id = $1 ORDER BY orden ASC, created_at ASC',
    [siteId]
  );
  return json({ paginas: rows });
});

export const POST = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const body = await req.json();
  const nombre = String(body.nombre || '').trim();
  if (!body.site_id || !nombre) return error(400, 'Falta site_id o nombre.');
  if (!(await siteEsDelCliente(body.site_id, client_id))) return error(404, 'Sitio no encontrado.');

  const { rows: cuenta } = await consultar('SELECT COUNT(*)::int AS n FROM pages WHERE site_id = $1', [body.site_id]);

  // slug único por sitio (pages tiene UNIQUE(site_id, slug) en Neon).
  const base = slugificar(nombre) || 'pagina';
  let slug = base;
  for (let intento = 2; ; intento++) {
    const { rows: choque } = await consultar('SELECT 1 FROM pages WHERE site_id = $1 AND slug = $2', [body.site_id, slug]);
    if (!choque[0]) break;
    slug = `${base}-${intento}`;
  }

  const { rows } = await consultar(
    'INSERT INTO pages (site_id, nombre, slug, orden) VALUES ($1, $2, $3, $4) RETURNING id, nombre, slug, orden, created_at',
    [body.site_id, nombre, slug, cuenta[0].n]
  );
  return json({ pagina: rows[0] });
});
