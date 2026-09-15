import { Hono } from 'hono';
import { consultar } from '../lib/db.js';
import { clienteDesdeContexto } from '../lib/auth.js';
import { error } from '../lib/respuestas.js';

const app = new Hono();

app.post('/', async (c) => {
  const { client_id } = await clienteDesdeContexto(c);
  const body = await c.req.json();
  const nombre = String(body.nombre || '').trim();
  if (!nombre) return error(c, 400, 'Falta nombre.');

  await consultar(c, 'UPDATE clients SET nombre = $1 WHERE id = $2', [nombre, client_id]);
  return c.json({ nombre });
});

export default app;
