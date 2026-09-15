import { Hono } from 'hono';
import { consultar } from '../lib/db.js';
import { clienteDesdeContexto } from '../lib/auth.js';
import { error } from '../lib/respuestas.js';

const app = new Hono();

app.post('/', async (c) => {
  const { client_id } = await clienteDesdeContexto(c);
  const body = await c.req.json();
  if (!body.site_id || !body.favicon_url) return error(c, 400, 'Falta site_id o favicon_url.');

  const { rows } = await consultar(
    c,
    'UPDATE sites SET favicon_url = $1 WHERE id = $2 AND client_id = $3 RETURNING favicon_url',
    [body.favicon_url, body.site_id, client_id]
  );
  if (!rows[0]) return error(c, 404, 'Sitio no encontrado.');
  return c.json({ favicon_url: rows[0].favicon_url });
});

export default app;
