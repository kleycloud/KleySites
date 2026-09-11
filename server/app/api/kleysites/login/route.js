import bcrypt from 'bcryptjs';
import { consultar } from '../../../../lib/db.js';
import { firmarToken } from '../../../../lib/auth.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../lib/respuestas.js';

export const OPTIONS = opciones;

export const POST = conManejoDeErrores(async (req) => {
  const body = await req.json();
  const { rows } = await consultar(
    'SELECT id, email, password_hash, verified FROM clients WHERE email = $1 LIMIT 1',
    [body.email]
  );
  const cliente = rows[0];

  if (!cliente || !cliente.password_hash) return error(401, 'Correo o contraseña incorrectos.');
  if (!cliente.verified) return error(401, 'Aún no verificaste tu correo.');

  const coincide = await bcrypt.compare(body.password || '', cliente.password_hash);
  if (!coincide) return error(401, 'Correo o contraseña incorrectos.');

  const token = firmarToken({ client_id: cliente.id, email: cliente.email });
  return json({ token, client_id: cliente.id });
});
