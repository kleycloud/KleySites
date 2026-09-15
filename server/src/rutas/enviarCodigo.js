import { Hono } from 'hono';
import { consultar } from '../lib/db.js';

const app = new Hono();

// Login/registro "passwordless" por código: si el correo no existe, se
// crea el cliente sin password_hash (igual que el flujo de Google).
app.post('/', async (c) => {
  const body = await c.req.json();
  const email = String(body.email || '').trim().toLowerCase();
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { rows } = await consultar(c, 'SELECT id FROM clients WHERE email = $1 LIMIT 1', [email]);

  if (rows[0]) {
    await consultar(c, 'UPDATE clients SET verification_code = $1, verification_expires = $2 WHERE email = $3', [codigo, expira, email]);
  } else {
    await consultar(
      c,
      'INSERT INTO clients (email, password_hash, verification_code, verification_expires, verified) VALUES ($1, NULL, $2, $3, false)',
      [email, codigo, expira]
    );
  }

  // TODO: enviar `codigo` por correo.
  return c.json({ enviado: true });
});

export default app;
