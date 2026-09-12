import { consultar } from '../../../../../lib/db.js';
import { clienteDesdeRequest } from '../../../../../lib/auth.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../../lib/respuestas.js';

export const OPTIONS = opciones;

// La imagen ya viene generada por el navegador (html2canvas del lienzo,
// ver src/js/editor/miniatura.js) y subida a Cloudinary — acá solo se
// guarda la URL, igual que favicon_url.
export const POST = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const body = await req.json();
  if (!body.site_id || !body.thumbnail_url) return error(400, 'Falta site_id o thumbnail_url.');

  const { rows } = await consultar(
    'UPDATE sites SET thumbnail_url = $1 WHERE id = $2 AND client_id = $3 RETURNING thumbnail_url',
    [body.thumbnail_url, body.site_id, client_id]
  );
  if (!rows[0]) return error(404, 'Sitio no encontrado.');
  return json({ thumbnail_url: rows[0].thumbnail_url });
});
