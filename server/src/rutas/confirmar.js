import { Hono } from 'hono';
import { consultar } from '../lib/db.js';
import { firmarToken } from '../lib/auth.js';
import { error } from '../lib/respuestas.js';

const app = new Hono();

app.post('/', async (c) => {
  const body = await c.req.json();
  const email = String(body.email || '').trim().toLowerCase();

  const { rows } = await consultar(
    c,
    'SELECT id, verification_code, verification_expires FROM clients WHERE email = $1 LIMIT 1',
    [email]
  );
  const cliente = rows[0];
  if (!cliente) return error(c, 404, 'No existe una cuenta con ese correo.');
  if (new Date(cliente.verification_expires) < new Date()) return error(c, 400, 'El código expiró, pide uno nuevo.');
  if (String(cliente.verification_code) !== String(body.codigo)) return error(c, 400, 'Código incorrecto.');

  await consultar(c, 'UPDATE clients SET verified = true, verification_code = NULL WHERE id = $1', [cliente.id]);
  const token = await firmarToken(c.env, { client_id: cliente.id });
  return c.json({ token, client_id: cliente.id });
});

export default app;
