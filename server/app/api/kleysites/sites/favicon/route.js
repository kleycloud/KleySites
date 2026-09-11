import { consultar } from '../../../../../lib/db.js';
import { clienteDesdeRequest } from '../../../../../lib/auth.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../../lib/respuestas.js';

export const OPTIONS = opciones;

export const POST = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const body = await req.json();
  if (!body.site_id || !body.favicon_url) return error(400, 'Falta site_id o favicon_url.');

  const { rows } = await consultar(
    'UPDATE sites SET favicon_url = $1 WHERE id = $2 AND client_id = $3 RETURNING favicon_url',
    [body.favicon_url, body.site_id, client_id]
  );
  if (!rows[0]) return error(404, 'Sitio no encontrado.');
  return json({ favicon_url: rows[0].favicon_url });
});
