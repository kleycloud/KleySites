import bcrypt from 'bcryptjs';
import { consultar } from '../../../../lib/db.js';
import { json, error, conManejoDeErrores, opciones } from '../../../../lib/respuestas.js';

export const OPTIONS = opciones;

// Registro clásico con verificación por código (ver /kleysites/confirmar).
// El código expira en 15 min, igual que el workflow de n8n que reemplaza.
export const POST = conManejoDeErrores(async (req) => {
  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();

  if (!email || !body.password || body.password.length < 8) {
    return error(400, 'Correo o contraseña inválidos (mínimo 8 caracteres).');
  }

  const existente = await consultar('SELECT id FROM clients WHERE email = $1 LIMIT 1', [email]);
  if (existente.rows[0]) return error(409, 'Ya existe una cuenta con ese correo.');

  const hash = await bcrypt.hash(body.password, 10);
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { rows } = await consultar(
    `INSERT INTO clients (email, password_hash, verification_code, verification_expires, verified)
     VALUES ($1, $2, $3, $4, false) RETURNING id, email`,
    [email, hash, codigo, expira]
  );

  // TODO: enviar `codigo` por correo (el workflow de n8n usaba un nodo de email aparte).
  return json({ registrado: true, client_id: rows[0].id });
});
