import { consultar } from '../../../../lib/db.js';
import { clienteDesdeRequest } from '../../../../lib/auth.js';
import { slugificar, slugDisponible } from '../../../../lib/slug.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../lib/respuestas.js';

export const OPTIONS = opciones;

const LIMITE_SITIOS_PLAN_GRATIS = 1;

export const GET = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  // paginas_count viene de un LEFT JOIN (no de una subconsulta por sitio)
  // para traer todo en una sola ida a la base — el dashboard lo usa para
  // la tarjeta de cada sitio y para la estadística "Páginas totales".
  const { rows } = await consultar(
    `SELECT sites.id, sites.nombre, sites.slug, sites.favicon_url, sites.thumbnail_url,
            sites.published_at, sites.created_at, COUNT(pages.id)::int AS paginas_count
     FROM sites LEFT JOIN pages ON pages.site_id = sites.id
     WHERE sites.client_id = $1
     GROUP BY sites.id
     ORDER BY sites.created_at DESC`,
    [client_id]
  );
  return json({ sitios: rows });
});

export const POST = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const body = await req.json();
  const nombre = String(body.nombre || '').trim();
  if (!nombre) return error(400, 'El sitio necesita un nombre.');

  const cliente = await consultar('SELECT plan FROM clients WHERE id = $1', [client_id]);
  const plan = cliente.rows[0]?.plan || 'gratis';
  if (plan === 'gratis') {
    const { rows } = await consultar('SELECT COUNT(*)::int AS n FROM sites WHERE client_id = $1', [client_id]);
    if (rows[0].n >= LIMITE_SITIOS_PLAN_GRATIS) {
      return error(402, `Ya tienes ${LIMITE_SITIOS_PLAN_GRATIS} sitio en el plan gratis. Pasa a Pro para crear más sitios.`);
    }
  }

  const base = slugificar(nombre) || 'sitio';
  const slug = await slugDisponible(base);

  const { rows } = await consultar(
    'INSERT INTO sites (client_id, nombre, slug) VALUES ($1, $2, $3) RETURNING id, nombre, slug, favicon_url, thumbnail_url, published_at, created_at',
    [client_id, nombre, slug]
  );
  return json({ site: rows[0] });
});

export const PATCH = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const body = await req.json();
  const nombre = String(body.nombre || '').trim();
  if (!body.site_id || !nombre) return error(400, 'Falta site_id o nombre.');

  const { rows } = await consultar(
    'UPDATE sites SET nombre = $1 WHERE id = $2 AND client_id = $3 RETURNING id, nombre, slug, favicon_url, thumbnail_url, published_at, created_at',
    [nombre, body.site_id, client_id]
  );
  if (!rows[0]) return error(404, 'Sitio no encontrado.');
  return json({ site: rows[0] });
});

export const DELETE = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const siteId = new URL(req.url).searchParams.get('site_id');
  if (!siteId) return error(400, 'Falta site_id.');

  const { rows } = await consultar('DELETE FROM sites WHERE id = $1 AND client_id = $2 RETURNING id', [siteId, client_id]);
  if (!rows[0]) return error(404, 'Sitio no encontrado.');
  return json({ eliminado: true });
});
