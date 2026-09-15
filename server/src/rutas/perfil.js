import { Hono } from 'hono';
import { consultar } from '../lib/db.js';
import { clienteDesdeContexto } from '../lib/auth.js';

const app = new Hono();

app.get('/', async (c) => {
  const { client_id } = await clienteDesdeContexto(c);
  const { rows } = await consultar(c, 'SELECT email, avatar_url, plan, nombre FROM clients WHERE id = $1', [client_id]);
  return c.json({ perfil: rows[0] || {} });
});

export default app;
