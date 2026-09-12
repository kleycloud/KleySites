import { consultar } from '../../../../../lib/db.js';
import { clienteDesdeRequest } from '../../../../../lib/auth.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../../lib/respuestas.js';

export const OPTIONS = opciones;

export const POST = conManejoDeErrores(async (req) => {
  const { client_id } = clienteDesdeRequest(req);
  const body = await req.json();
  const nombre = String(body.nombre || '').trim();
  if (!nombre) return error(400, 'Falta nombre.');

  await consultar('UPDATE clients SET nombre = $1 WHERE id = $2', [nombre, client_id]);
  return json({ nombre });
});
