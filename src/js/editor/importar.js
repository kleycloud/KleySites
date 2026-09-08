/*
  importar.js
  Convierte un string de HTML (pegado o subido) en el mismo formato de
  árbol que usan las plantillas: [{ tipo, contenido, hijos? }, ...].
  Es una conversión heurística — HTML arbitrario no mapea 1:1 al catálogo
  de bloques, así que se hace lo razonable y todo lo no reconocido cae
  como bloque de texto.
*/

import { sanearHTML } from './state.js';

function textoPlano(el) {
  return (el.textContent || '').trim();
}

function nivelTitulo(tag) {
  if (tag === 'h1') return 'h1';
  if (tag === 'h2') return 'h2';
  if (tag === 'h3') return 'h3';
  return 'h4';
}

const TAGS_IGNORADAS = new Set(['script', 'style', 'meta', 'link', 'title', 'noscript', 'template']);

function elementoABloque(el) {
  const tag = el.tagName.toLowerCase();
  if (TAGS_IGNORADAS.has(tag)) return null;

  if (/^h[1-6]$/.test(tag)) {
    return { tipo: 'titulo', contenido: { texto: textoPlano(el), nivel: nivelTitulo(tag) } };
  }
  if (tag === 'img') {
    return { tipo: 'imagen', contenido: { src: el.getAttribute('src') || '', alt: el.getAttribute('alt') || '' } };
  }
  if (tag === 'hr') {
    return { tipo: 'separador', contenido: {} };
  }
  if (tag === 'video') {
    const src = el.getAttribute('src') || el.querySelector('source')?.getAttribute('src') || '';
    return { tipo: 'video', contenido: { src } };
  }
  if (tag === 'iframe') {
    return { tipo: 'mapa', contenido: { src: el.getAttribute('src') || '' } };
  }
  if (tag === 'a' || tag === 'button') {
    return { tipo: 'boton', contenido: { texto: textoPlano(el) || 'Botón', href: el.getAttribute('href') || '#' } };
  }
  if (tag === 'form') {
    const tituloEl = el.querySelector('h1, h2, h3, legend');
    const botonEl = el.querySelector('button, input[type="submit"]');
    return {
      tipo: 'formulario',
      contenido: {
        titulo: tituloEl ? textoPlano(tituloEl) : 'Contáctanos',
        boton: (botonEl && (textoPlano(botonEl) || botonEl.getAttribute('value'))) || 'Enviar',
      },
    };
  }

  const imagenes = Array.from(el.querySelectorAll('img'))
    .map((img) => img.getAttribute('src') || '')
    .filter(Boolean);
  if (imagenes.length >= 2) {
    return { tipo: 'galeria', contenido: { imagenes: imagenes.join('\n') } };
  }

  const hijosElemento = Array.from(el.children);
  if (hijosElemento.length >= 2) {
    const hijos = hijosElemento.map(elementoABloque).filter(Boolean);
    if (hijos.length) return { tipo: 'seccion', contenido: {}, hijos };
  }

  const html = sanearHTML(el.innerHTML);
  if (!html.trim()) return null;
  return { tipo: 'texto', contenido: { html } };
}

export function analizarHTML(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.body.children).map(elementoABloque).filter(Boolean);
}
