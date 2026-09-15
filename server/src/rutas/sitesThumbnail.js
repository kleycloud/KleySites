import { Hono } from 'hono';
import { consultar } from '../lib/db.js';
import { clienteDesdeContexto } from '../lib/auth.js';
import { error } from '../lib/respuestas.js';

const app = new Hono();

// La imagen ya viene generada por el navegador (html2canvas del lienzo,
// ver src/js/editor/miniatura.js) y subida a Cloudinary — acá solo se
// guarda la URL, igual que favicon_url.
app.post('/', async (c) => {
  const { client_id } = await clienteDesdeContexto(c);
  const body = await c.req.json();
  if (!body.site_id || !body.thumbnail_url) return error(c, 400, 'Falta site_id o thumbnail_url.');

  const { rows } = await consultar(
    c,
    'UPDATE sites SET thumbnail_url = $1 WHERE id = $2 AND client_id = $3 RETURNING thumbnail_url',
    [body.thumbnail_url, body.site_id, client_id]
  );
  if (!rows[0]) return error(c, 404, 'Sitio no encontrado.');
  return c.json({ thumbnail_url: rows[0].thumbnail_url });
});

export default app;
