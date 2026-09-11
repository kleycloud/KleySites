import { consultar } from '../../../../lib/db.js';
import { firmarToken } from '../../../../lib/auth.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../lib/respuestas.js';

export const OPTIONS = opciones;

export const POST = conManejoDeErrores(async (req) => {
  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();

  const { rows } = await consultar(
    'SELECT id, verification_code, verification_expires FROM clients WHERE email = $1 LIMIT 1',
    [email]
  );
  const cliente = rows[0];
  if (!cliente) return error(404, 'No existe una cuenta con ese correo.');
  if (new Date(cliente.verification_expires) < new Date()) return error(400, 'El código expiró, pide uno nuevo.');
  if (String(cliente.verification_code) !== String(body.codigo)) return error(400, 'Código incorrecto.');

  await consultar('UPDATE clients SET verified = true, verification_code = NULL WHERE id = $1', [cliente.id]);
  const token = firmarToken({ client_id: cliente.id });
  return json({ token, client_id: cliente.id });
});
