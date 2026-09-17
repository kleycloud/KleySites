/*
  documento.js
  Arma la página HTML completa a partir de la lista plana de bloques —
  la misma para Vista previa, el ZIP exportado y lo publicado.
*/

import { renderBloque } from './bloques.js';
import { hijosVisibles, raicesDeZona } from './arbol.js';
import { escapeHTML } from './sanear.js';
import { fuentesUsadas, urlGoogleFonts } from './fuentes.js';

const BADGE_HTML = '<a href="https://kleysites.pages.dev" target="_blank" rel="noopener" style="position:fixed;bottom:12px;right:12px;background:#0b0b0f;color:#fff;font:12px system-ui,sans-serif;padding:6px 10px;border-radius:8px;text-decoration:none;opacity:.85;z-index:9999;">Hecho con KleySites</a>';

// Los @keyframes son los mismos de canvas.css (estilos.animacion).
const CSS_BASE = `*{box-sizing:border-box}body{margin:0;font-family:'Inter',system-ui,sans-serif;line-height:1.5;color:#1a1a1a;background:#fff}img{max-width:100%;height:auto}h1,h2,h3,h4{margin:0 0 .5em;line-height:1.2}p{margin:0 0 1em}header,main,footer,#hero{display:flex;flex-direction:column;gap:16px;padding:24px}main{min-height:40vh}@keyframes kley-aparecer{from{opacity:0}to{opacity:1}}@keyframes kley-subir{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}@keyframes kley-bajar{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:none}}@keyframes kley-crecer{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}`;

function renderArbol(bloques, b) {
  const hijos = hijosVisibles(bloques, b).map((h) => renderArbol(bloques, h)).join('\n');
  return renderBloque(b, hijos);
}

function renderZona(bloques, zona) {
  return raicesDeZona(bloques, zona).map((b) => renderArbol(bloques, b)).join('\n');
}

export function generarDocumento({ titulo, bloques, faviconUrl, badge = false, conManifest = false, lang = 'es' }) {
  const fuentes = urlGoogleFonts(fuentesUsadas(bloques));
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<title>${escapeHTML(titulo || 'Mi sitio')}</title>`,
    faviconUrl ? `<link rel="icon" href="${escapeHTML(faviconUrl)}">` : '',
    conManifest ? '<link rel="manifest" href="manifest.json">' : '',
    fuentes ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="${fuentes}" rel="stylesheet">` : '',
    `<style>${CSS_BASE}</style>`,
  ].filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
${head}
</head>
<body>
<header>${renderZona(bloques, 'encabezado')}</header>
<section id="hero">${renderZona(bloques, 'hero')}</section>
<main>${renderZona(bloques, 'contenido')}</main>
<footer>${renderZona(bloques, 'pie')}</footer>
${badge ? BADGE_HTML : ''}
</body>
</html>`;
}
