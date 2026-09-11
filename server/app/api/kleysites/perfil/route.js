import { consultar } from '../../../../lib/db.js';
import { clienteDesdeRequest } from '../../../../lib/auth.js';
import { json, conManejoDeErrores, opciones } from '../../../../lib/respuestas.js';

export const OPTIONS = opciones;

export const GET = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const { rows } = await consultar('SELECT email, avatar_url, plan FROM clients WHERE id = $1', [client_id]);
  return json({ perfil: rows[0] || {} });
});
