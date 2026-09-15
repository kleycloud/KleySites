import { Hono } from 'hono';
import { consultar } from '../lib/db.js';
import { clienteDesdeContexto } from '../lib/auth.js';
import { error } from '../lib/respuestas.js';

const app = new Hono();

// `avatar_url: null` (con la clave presente) borra la foto — distinto de
// no mandar el campo, que es un pedido inválido.
app.post('/', async (c) => {
  const { client_id } = await clienteDesdeContexto(c);
  const body = await c.req.json();
  if (!('avatar_url' in body)) return error(c, 400, 'Falta avatar_url.');

  const avatarUrl = body.avatar_url || null;
  await consultar(c, 'UPDATE clients SET avatar_url = $1 WHERE id = $2', [avatarUrl, client_id]);
  return c.json({ avatar_url: avatarUrl });
});

export default app;
