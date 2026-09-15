// Deploy a Cloudflare Pages por API directa — reemplaza el shell-out a la
// CLI de wrangler que usaba Vercel (Workers no tiene child_process). Este
// es el mismo protocolo de 5 llamadas que usa Wrangler internamente
// (verificado leyendo su código fuente real, no la API "ingenua" de un
// solo POST que fue la que dio problemas la primera vez) — validado
// también con un deploy real de prueba antes de escribir esto.
import { hashArchivo } from './hashBlake3.js';

const CF_BASE = 'https://api.cloudflare.com/client/v4';

async function cfApi(env, ruta, opts = {}) {
  const resp = await fetch(`${CF_BASE}${ruta}`, opts);
  const data = await resp.json().catch(() => null);
  if (!resp.ok || (data && data.success === false)) {
    throw new Error(`${ruta} -> ${resp.status}: ${JSON.stringify(data)}`);
  }
  return data.result;
}

async function asegurarProyecto(env, slug) {
  const headers = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' };
  const existe = await fetch(`${CF_BASE}/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${slug}`, { headers });
  if (existe.ok) return;

  await fetch(`${CF_BASE}/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: slug, production_branch: 'main' }),
  });
}

// `archivos`: [{ nombre, contenido }] ya validados por la ruta (solo
// nombres planos .html/.json/.txt).
export async function publicarArchivos(env, slug, archivos) {
  await asegurarProyecto(env, slug);

  const manifest = {};
  const porHash = {};
  for (const a of archivos) {
    const hash = hashArchivo(a.contenido, a.nombre);
    manifest['/' + a.nombre] = hash;
    porHash[hash] = a;
  }

  // 1. token de subida (con el API token normal)
  const { jwt } = await cfApi(env, `/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${slug}/upload-token`, {
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
  });

  // 2. qué hashes ya existen (evita resubir archivos sin cambios)
  const faltantes = await cfApi(env, `/pages/assets/check-missing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ hashes: Object.values(manifest) }),
  });

  // 3. subir solo los que faltan
  if (faltantes.length > 0) {
    const payload = faltantes.map((hash) => ({
      key: hash,
      value: Buffer.from(porHash[hash].contenido, 'utf8').toString('base64'),
      metadata: { contentType: contentTypeDe(porHash[hash].nombre) },
      base64: true,
    }));
    await cfApi(env, `/pages/assets/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
      body: JSON.stringify(payload),
    });
  }

  // 4. confirmar los hashes (para el cache de la próxima subida)
  await cfApi(env, `/pages/assets/upsert-hashes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ hashes: Object.values(manifest) }),
  });

  // 5. crear el deployment (de vuelta con el API token normal, no el jwt)
  const form = new FormData();
  form.append('branch', 'main');
  form.append('manifest', JSON.stringify(manifest));
  const deployResp = await fetch(`${CF_BASE}/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${slug}/deployments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` },
    body: form,
  });
  if (!deployResp.ok) {
    throw new Error(`deployments -> ${deployResp.status}: ${await deployResp.text()}`);
  }

  // Se devuelve el alias estable de producción, no la URL del deployment
  // individual (esa es por-hash y su certificado puede tardar unos
  // segundos en propagarse recién creado).
  return { url: `https://${slug}.pages.dev` };
}

function contentTypeDe(nombre) {
  if (nombre.endsWith('.html')) return 'text/html';
  if (nombre.endsWith('.json')) return 'application/json';
  return 'text/plain';
}
