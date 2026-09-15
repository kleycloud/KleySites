import { Hono } from 'hono';
import { consultar } from '../lib/db.js';
import { firmarToken } from '../lib/auth.js';
import { error } from '../lib/respuestas.js';

const app = new Hono();

app.post('/', async (c) => {
  const body = await c.req.json();
  const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.id_token || '')}`);
  const info = await resp.json();

  if (!info.email || info.aud !== c.env.GOOGLE_CLIENT_ID_WEB || info.email_verified !== 'true') {
    return error(c, 401, 'Token de Google inválido.');
  }

  const { rows } = await consultar(c, 'SELECT id FROM clients WHERE email = $1 LIMIT 1', [info.email]);
  let clientId = rows[0]?.id;

  if (!clientId) {
    const creado = await consultar(
      c,
      'INSERT INTO clients (email, password_hash, verified) VALUES ($1, NULL, true) RETURNING id',
      [info.email]
    );
    clientId = creado.rows[0].id;
  }

  const token = await firmarToken(c.env, { client_id: clientId });
  return c.json({ token, client_id: clientId });
});

export default app;
