import { consultar } from '../../../../../lib/db.js';
import { clienteDesdeRequest } from '../../../../../lib/auth.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../../lib/respuestas.js';

export const OPTIONS = opciones;

export const POST = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const body = await req.json();
  if (!body.avatar_url) return error(400, 'Falta avatar_url.');

  await consultar('UPDATE clients SET avatar_url = $1 WHERE id = $2', [body.avatar_url, client_id]);
  return json({ avatar_url: body.avatar_url });
});
