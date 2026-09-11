import { consultar } from '../../../../lib/db.js';
import { clienteDesdeRequest } from '../../../../lib/auth.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../lib/respuestas.js';

export const OPTIONS = opciones;

// Los bloques cuelgan de una página, que a su vez pertenece a un sitio
// del cliente — así que la pertenencia se valida con un JOIN en vez de
// guardar client_id en la propia fila (evita tener que confiar en lo que
// mande el navegador).
async function pageEsDelCliente(pageId, clientId) {
  const { rows } = await consultar(
    `SELECT pages.id FROM pages
     JOIN sites ON sites.id = pages.site_id
     WHERE pages.id = $1 AND sites.client_id = $2`,
    [pageId, clientId]
  );
  return !!rows[0];
}

export const GET = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const pageId = new URL(req.url).searchParams.get('page_id');
  if (!pageId) return error(400, 'Falta page_id.');
  if (!(await pageEsDelCliente(pageId, client_id))) return error(404, 'Página no encontrada.');

  const { rows } = await consultar(
    'SELECT id, tipo, contenido, orden, zona, parent_id, estilos FROM blocks WHERE page_id = $1 ORDER BY zona, orden ASC',
    [pageId]
  );
  return json({ bloques: rows });
});

export const POST = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const body = await req.json();
  if (!body.page_id) return error(400, 'Falta page_id.');
  if (!(await pageEsDelCliente(body.page_id, client_id))) return error(404, 'Página no encontrada.');

  const contenido = JSON.stringify(body.contenido || {});
  const estilos = JSON.stringify(body.estilos || {});
  const zona = body.zona || 'contenido';
  const orden = body.orden || 0;

  // Upsert por id: así el editor puede llamar a esto tanto para crear
  // como para actualizar (guarda con `block_id` si el bloque ya existe).
  const { rows } = await consultar(
    `INSERT INTO blocks (id, page_id, client_id, tipo, contenido, orden, zona, parent_id, estilos)
     VALUES (COALESCE($1::int, nextval('blocks_id_seq')), $2, $3, $4, $5::jsonb, $6, $7, $8, $9::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       tipo = EXCLUDED.tipo, contenido = EXCLUDED.contenido, orden = EXCLUDED.orden,
       zona = EXCLUDED.zona, parent_id = EXCLUDED.parent_id, estilos = EXCLUDED.estilos
     WHERE blocks.page_id = EXCLUDED.page_id AND blocks.client_id = EXCLUDED.client_id
     RETURNING id, tipo, contenido, orden, zona, parent_id, estilos`,
    [body.block_id || null, body.page_id, client_id, body.tipo, contenido, orden, zona, body.parent_id || null, estilos]
  );
  return json({ bloque: rows[0] });
});

export const DELETE = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const blockId = new URL(req.url).searchParams.get('block_id');
  if (!blockId) return error(400, 'Falta block_id.');

  const { rows } = await consultar(
    `DELETE FROM blocks USING pages, sites
     WHERE blocks.id = $1 AND blocks.page_id = pages.id AND pages.site_id = sites.id AND sites.client_id = $2
     RETURNING blocks.id`,
    [blockId, client_id]
  );
  if (!rows[0]) return error(404, 'Bloque no encontrado.');
  return json({ eliminado: true });
});
