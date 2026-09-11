import { consultar } from '../../../../lib/db.js';
import { json, conManejoDeErrores, opciones } from '../../../../lib/respuestas.js';

export const OPTIONS = opciones;

// Login/registro "passwordless" por código: si el correo no existe, se
// crea el cliente sin password_hash (igual que el flujo de Google).
export const POST = conManejoDeErrores(async (req) => {
  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { rows } = await consultar('SELECT id FROM clients WHERE email = $1 LIMIT 1', [email]);

  if (rows[0]) {
    await consultar('UPDATE clients SET verification_code = $1, verification_expires = $2 WHERE email = $3', [codigo, expira, email]);
  } else {
    await consultar(
      'INSERT INTO clients (email, password_hash, verification_code, verification_expires, verified) VALUES ($1, NULL, $2, $3, false)',
      [email, codigo, expira]
    );
  }

  // TODO: enviar `codigo` por correo.
  return json({ enviado: true });
});
