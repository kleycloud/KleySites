import { Hono } from 'hono';
import { consultar } from '../lib/db.js';
import { clienteDesdeContexto } from '../lib/auth.js';
import { publicarArchivos } from '../lib/cloudflarePages.js';
import { error } from '../lib/respuestas.js';

const app = new Hono();

// El frontend manda el sitio ya generado (los mismos archivos que
// Exportar); acá solo se valida y se despliega. Nada de binarios: el
// favicon y las imágenes son URLs externas dentro del HTML.
const NOMBRE_VALIDO = /^[A-Za-z0-9-]+\.(html|json|txt|xml)$/;
const MAX_ARCHIVOS = 50;
const MAX_BYTES = 5 * 1024 * 1024;

function validarArchivos(archivos) {
  if (!Array.isArray(archivos) || !archivos.length || archivos.length > MAX_ARCHIVOS) return 'Faltan los archivos del sitio.';
  let total = 0;
  for (const a of archivos) {
    if (!a || typeof a.nombre !== 'string' || typeof a.contenido !== 'string') return 'Archivo inválido.';
    if (!NOMBRE_VALIDO.test(a.nombre)) return `Nombre de archivo no permitido: ${a.nombre}`;
    total += new TextEncoder().encode(a.contenido).length;
  }
  if (!archivos.some((a) => a.nombre === 'index.html')) return 'Falta index.html.';
  return total > MAX_BYTES ? 'El sitio supera los 5 MB.' : null;
}

app.post('/', async (c) => {
  const { client_id } = await clienteDesdeContexto(c);
  const body = await c.req.json();
  if (!body.site_id) return error(c, 400, 'Falta site_id.');

  const invalido = validarArchivos(body.archivos);
  if (invalido) return error(c, 400, invalido);

  const { rows } = await consultar(c, 'SELECT slug FROM sites WHERE id = $1 AND client_id = $2', [body.site_id, client_id]);
  if (!rows[0]) return error(c, 404, 'Sitio no encontrado.');
  const { slug } = rows[0];

  try {
    const { url } = await publicarArchivos(c.env, slug, body.archivos);
    await consultar(c, 'UPDATE sites SET published_at = now() WHERE id = $1', [body.site_id]);
    return c.json({ publicado: true, slug, url });
  } catch (e) {
    console.error('Fallo el deploy a Cloudflare Pages', e);
    return error(c, 502, 'El sitio se generó pero no se pudo publicar. Intenta de nuevo.');
  }
});

export default app;
