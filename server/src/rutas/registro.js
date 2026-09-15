import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { consultar } from '../lib/db.js';
import { error } from '../lib/respuestas.js';

const app = new Hono();

// Registro clásico con verificación por código (ver /kleysites/confirmar).
// El código expira en 15 min.
app.post('/', async (c) => {
  const body = await c.req.json();
  const email = String(body.email || '').trim().toLowerCase();

  if (!email || !body.password || body.password.length < 8) {
    return error(c, 400, 'Correo o contraseña inválidos (mínimo 8 caracteres).');
  }

  const existente = await consultar(c, 'SELECT id FROM clients WHERE email = $1 LIMIT 1', [email]);
  if (existente.rows[0]) return error(c, 409, 'Ya existe una cuenta con ese correo.');

  const hash = await bcrypt.hash(body.password, 10);
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { rows } = await consultar(
    c,
    `INSERT INTO clients (email, password_hash, verification_code, verification_expires, verified)
     VALUES ($1, $2, $3, $4, false) RETURNING id, email`,
    [email, hash, codigo, expira]
  );

  // TODO: enviar `codigo` por correo — todavía no hay proveedor de email conectado.
  return c.json({ registrado: true, client_id: rows[0].id });
});

export default app;
