// Deploy a Cloudflare Pages vía la CLI de Wrangler (no la API de "Direct
// Upload" directa) — la API multipart da errores intermitentes. Wrangler
// necesita CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID como variables
// de entorno (los lee solo).
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execFileAsync = promisify(execFile);

// Se invoca con `node <script>.js` en vez del symlink de .bin/wrangler:
// el tracing de archivos de Vercel no empaqueta symlinks a los que solo
// se llega por un path armado en runtime, y el bit de ejecutable tampoco
// se preserva siempre. El .js sí llega, declarado en next.config.js
// (outputFileTracingIncludes).
const WRANGLER_ENTRY = join(process.cwd(), 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const CF_BASE = 'https://api.cloudflare.com/client/v4';

async function asegurarProyecto(slug) {
  const headers = {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
  const existe = await fetch(`${CF_BASE}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${slug}`, { headers });
  if (existe.ok) return;

  await fetch(`${CF_BASE}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: slug, production_branch: 'main' }),
  });
}

export async function publicarHTML(slug, html) {
  await asegurarProyecto(slug);

  const dir = await mkdtemp(join(tmpdir(), 'kleysites-deploy-'));
  try {
    await writeFile(join(dir, 'index.html'), html, 'utf-8');

    await execFileAsync(
      process.execPath,
      [WRANGLER_ENTRY, 'pages', 'deploy', dir, `--project-name=${slug}`, '--branch=main', '--commit-dirty=true'],
      // cwd = el directorio temporal, no process.cwd(): en Vercel
      // process.cwd() es /var/task (el bundle, de solo lectura) y
      // wrangler necesita poder crear su carpeta de caché junto al cwd.
      { cwd: dir, env: process.env }
    );

    // Se devuelve el alias estable de producción, no la URL del deployment
    // individual que imprime wrangler (esa es por-hash y su certificado
    // puede tardar unos segundos en propagarse recién creado).
    return { url: `https://${slug}.pages.dev` };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
