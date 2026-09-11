/*
  html.js
  Convierte HTML libre (pegado o subido, por ejemplo generado por Claude)
  en bloques con sus estilos reales. Es heurístico — HTML arbitrario no
  mapea 1:1 al catálogo — así que se hace lo razonable: títulos, imágenes,
  botones, formularios, videos y mapas se reconocen; un contenedor con
  varios hijos es una sección (o columnas si está en flex/grid); y todo lo
  demás cae como bloque de texto. <header> y <footer> de raíz van a sus
  zonas; el resto, a la zona activa.
*/

import { sanearHTML } from '../state.js';
import { cargarEnIframe, crearContexto, extraerEstilos, estilosDelBody } from './estilos-html.js';

const TAGS_IGNORADAS = new Set(['script', 'style', 'meta', 'link', 'title', 'noscript', 'template', 'br']);
const CLAVES_CONTENEDOR = ['fondo', 'borde', 'radio', 'padding_arriba', 'padding_abajo', 'padding_izquierda', 'padding_derecha', 'sombra'];

const textoPlano = (el) => (el.textContent || '').trim();

function nivelTitulo(tag) {
  return /^h[1-6]$/.test(tag) ? tag : 'h4';
}

function hoja(el, tag) {
  if (/^h[1-6]$/.test(tag)) return { tipo: 'titulo', contenido: { texto: textoPlano(el), nivel: nivelTitulo(tag) } };
  if (tag === 'img') return { tipo: 'imagen', contenido: { src: el.getAttribute('src') || '', alt: el.getAttribute('alt') || '' } };
  if (tag === 'hr') return { tipo: 'separador', contenido: {} };
  if (tag === 'video') return { tipo: 'video', contenido: { src: el.getAttribute('src') || el.querySelector('source')?.getAttribute('src') || '' } };
  if (tag === 'iframe') return { tipo: 'mapa', contenido: { src: el.getAttribute('src') || '' } };
  if (tag === 'a' || tag === 'button') return { tipo: 'boton', contenido: { texto: textoPlano(el) || 'Botón', href: el.getAttribute('href') || '#' } };
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
  return null;
}

function esFlexOGrid(el, ctx) {
  const cs = ctx.win.getComputedStyle(el);
  return (cs.display.includes('flex') && cs.flexDirection.startsWith('row')) || cs.display.includes('grid');
}

function elementoABloque(el, ctx, padreEl) {
  const tag = el.tagName.toLowerCase();
  if (TAGS_IGNORADAS.has(tag)) return null;
  const estilos = extraerEstilos(el, ctx, padreEl);

  const simple = hoja(el, tag);
  if (simple) return { ...simple, estilos };

  const imagenes = Array.from(el.querySelectorAll('img')).map((img) => img.getAttribute('src') || '').filter(Boolean);
  if (imagenes.length >= 2 && el.querySelectorAll('img').length === el.children.length) {
    return { tipo: 'galeria', contenido: { imagenes: imagenes.join('\n') }, estilos };
  }

  const hijosElemento = Array.from(el.children);
  const soloElementos = hijosElemento.length > 0 && !Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());

  if (soloElementos && hijosElemento.length >= 2) {
    const hijos = hijosElemento.map((h) => elementoABloque(h, ctx, el)).filter(Boolean);
    if (hijos.length) return { tipo: esFlexOGrid(el, ctx) ? 'columnas' : 'seccion', contenido: {}, estilos, hijos };
  }

  // Un solo hijo: si el contenedor aporta fondo/borde/relleno queda como
  // sección; si es un envoltorio sin más, se salta para no anidar de gusto.
  if (soloElementos && hijosElemento.length === 1) {
    const aporta = CLAVES_CONTENEDOR.some((k) => estilos[k]);
    if (aporta) {
      const hijo = elementoABloque(hijosElemento[0], ctx, el);
      return hijo ? { tipo: 'seccion', contenido: {}, estilos, hijos: [hijo] } : null;
    }
    return elementoABloque(hijosElemento[0], ctx, padreEl);
  }

  const html = sanearHTML(el.innerHTML);
  if (!html.trim()) return null;
  return { tipo: 'texto', contenido: { html }, estilos };
}

function conEstilosDelBody(nodo, base) {
  Object.entries(base).forEach(([k, v]) => { if (nodo.estilos[k] === undefined) nodo.estilos[k] = v; });
  return nodo;
}

export async function analizarHTML(html) {
  const { doc, win, destruir } = await cargarEnIframe(html);
  try {
    const ctx = crearContexto(doc, win);
    const base = estilosDelBody(doc, ctx);
    const resultado = { activa: [], encabezado: [], pie: [] };
    Array.from(doc.body.children).forEach((el) => {
      const tag = el.tagName.toLowerCase();
      const zona = tag === 'header' ? 'encabezado' : tag === 'footer' ? 'pie' : null;
      const elementos = zona ? Array.from(el.children) : [el];
      elementos.forEach((e) => {
        const nodo = elementoABloque(e, ctx, doc.body);
        if (nodo) resultado[zona || 'activa'].push(conEstilosDelBody(nodo, base));
      });
    });
    return resultado;
  } finally {
    destruir();
  }
}
