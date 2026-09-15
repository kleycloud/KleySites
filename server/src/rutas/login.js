import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { consultar } from '../lib/db.js';
import { firmarToken } from '../lib/auth.js';
import { error } from '../lib/respuestas.js';

const app = new Hono();

app.post('/', async (c) => {
  const body = await c.req.json();
  const { rows } = await consultar(
    c,
    'SELECT id, email, password_hash, verified FROM clients WHERE email = $1 LIMIT 1',
    [body.email]
  );
  const cliente = rows[0];

  if (!cliente || !cliente.password_hash) return error(c, 401, 'Correo o contraseña incorrectos.');
  if (!cliente.verified) return error(c, 401, 'Aún no verificaste tu correo.');

  const coincide = await bcrypt.compare(body.password || '', cliente.password_hash);
  if (!coincide) return error(c, 401, 'Correo o contraseña incorrectos.');

  const token = await firmarToken(c.env, { client_id: cliente.id, email: cliente.email });
  return c.json({ token, client_id: cliente.id });
});

export default app;
