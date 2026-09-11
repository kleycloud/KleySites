/*
  sitio.js
  Arma el sitio completo como lista de archivos [{ nombre, contenido }] —
  lo comparten Exportar (ZIP) y Publicar, así los dos producen exactamente
  lo mismo. Sin binarios: el favicon y los íconos del manifest referencian
  la URL de Cloudinary.
*/

import * as api from '../api.js';
import { state } from './state.js';
import { sincronizar } from './sync.js';
import { getPaginasSitio } from './paginas.js';
import { getSitioActual } from './ajustes.js';
import { generarDocumento } from '../render/documento.js';
import { generarManifest } from '../render/manifest.js';
import { aArbolPorZona } from '../render/arbol.js';

const LEEME = `Este es tu sitio exportado desde KleySites.

- index.html es la página principal; las demás páginas son <nombre>.html.
- Para publicarlo, sube esta carpeta completa a cualquier hosting estático
  (Cloudflare Pages, Netlify, Vercel, GitHub Pages...) o ábrela en tu navegador.
- manifest.json permite instalar el sitio como app en el celular.
- kleysites.json es el proyecto en formato KleySites: puedes volver a
  importarlo en el editor (Importar > subir archivo) para seguir editándolo.
`;

export async function obtenerPlan() {
  try {
    const resp = await api.obtenerPerfil();
    return resp.perfil.plan || 'gratis';
  } catch (e) {
    return 'gratis';
  }
}

export function slugificar(nombre) {
  return String(nombre || '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

async function bloquesDePagina(pagina) {
  if (pagina.id === state.pageId) return state.blocks;
  try {
    const resp = await api.listarBloques(pagina.id);
    return resp.bloques || [];
  } catch (e) {
    console.error('No se pudieron traer los bloques de la página', pagina.nombre, e);
    return [];
  }
}

export async function construirArchivosSitio() {
  await sincronizar();

  const sitio = getSitioActual() || {};
  const nombreSitio = sitio.nombre || document.getElementById('siteName').textContent || 'Mi sitio';
  const badge = (await obtenerPlan()) !== 'pro';
  let paginas = getPaginasSitio();
  if (!paginas.length) paginas = [{ id: state.pageId, nombre: 'Inicio' }];

  const archivos = [];
  const paginasJSON = [];
  for (const [i, p] of paginas.entries()) {
    const bloques = await bloquesDePagina(p);
    const slug = i === 0 ? 'index' : (p.slug || slugificar(p.nombre) || `pagina-${i + 1}`);
    archivos.push({
      nombre: `${slug}.html`,
      contenido: generarDocumento({
        titulo: paginas.length > 1 && i > 0 ? `${p.nombre} — ${nombreSitio}` : nombreSitio,
        bloques, faviconUrl: sitio.favicon_url, badge, conManifest: true,
      }),
    });
    paginasJSON.push({ nombre: p.nombre, slug, zonas: aArbolPorZona(bloques) });
  }

  archivos.push({ nombre: 'manifest.json', contenido: generarManifest({ nombre: nombreSitio, faviconUrl: sitio.favicon_url }) });
  archivos.push({
    nombre: 'kleysites.json',
    contenido: JSON.stringify({ version: 1, sitio: { nombre: nombreSitio }, paginas: paginasJSON }, null, 2),
  });
  archivos.push({ nombre: 'LEEME.txt', contenido: LEEME });

  return { archivos, slug: sitio.slug || slugificar(nombreSitio) || 'sitio' };
}
