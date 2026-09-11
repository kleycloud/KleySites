import { consultar } from '../../../../lib/db.js';
import { clienteDesdeRequest } from '../../../../lib/auth.js';
import { renderizarPagina } from '../../../../lib/render.js';
import { publicarHTML } from '../../../../lib/cloudflarePages.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../lib/respuestas.js';

export const OPTIONS = opciones;
// El deploy a Cloudflare Pages vía Wrangler puede tardar más que el
// límite por defecto (10s) — Vercel respeta esto hasta el tope de tu plan.
export const maxDuration = 60;

export const POST = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const body = await req.json();
  if (!body.site_id || !body.page_id) return error(400, 'Falta site_id o page_id.');

  const { rows: sitios } = await consultar(
    `SELECT sites.nombre, sites.slug FROM sites
     JOIN pages ON pages.site_id = sites.id
     WHERE sites.id = $1 AND pages.id = $2 AND sites.client_id = $3`,
    [body.site_id, body.page_id, client_id]
  );
  const sitio = sitios[0];
  if (!sitio) return error(404, 'Sitio o página no encontrados.');

  const { rows: bloques } = await consultar(
    'SELECT id, tipo, contenido, orden, zona, parent_id, estilos FROM blocks WHERE page_id = $1 ORDER BY zona, orden ASC',
    [body.page_id]
  );

  const html = renderizarPagina(bloques, sitio.nombre);

  try {
    const { url } = await publicarHTML(sitio.slug, html);
    return json({ publicado: true, slug: sitio.slug, url });
  } catch (e) {
    console.error('Fallo el deploy a Cloudflare Pages', e);
    return error(502, 'El sitio se generó pero no se pudo publicar. Intenta de nuevo.');
  }
});
