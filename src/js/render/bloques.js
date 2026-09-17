/*
  bloques.js
  Un renderizador por tipo de bloque, a HTML semántico limpio. Es el mismo
  código para el lienzo y para el HTML final; la única diferencia es la
  opción `lienzo`: ahí los textos llevan `data-editable-field` (doble clic
  para editar), el botón no navega y el formulario está deshabilitado.
  Agregar un tipo de bloque = agregar una entrada acá y otra en
  CATALOGO_BLOQUES (editor/state.js).
*/

import { ICONOS } from './iconos.js';
import { sanearHTML, escapeHTML, hrefSeguro } from './sanear.js';
import { estilosACSS } from './css.js';
import { RENDERERS_AVANZADOS } from './bloques-avanzados.js';

const BOTON_BASE = 'display:inline-block;padding:10px 18px;border-radius:8px;background:#FF8A3D;color:#0B0B0F;font-weight:700;font-size:14px;text-decoration:none';
const CAMPO_FORM = 'display:block;width:100%;padding:10px 12px;margin:0 0 8px;border:1px solid #ccc;border-radius:6px;font:inherit;box-sizing:border-box';

function placeholder(texto, op) {
  return op.lienzo ? `<div class="ed-block-placeholder">${texto}</div>` : '';
}

function editable(op, campo) {
  return op.lienzo ? ` class="ed-editable" data-editable-field="${campo}"` : '';
}

const RENDERERS = {
  texto: (c, s, op) => `<div${editable(op, 'contenido.html')} style="${s}">${sanearHTML(c.html)}</div>`,

  titulo: (c, s, op) => {
    const n = /^h[1-6]$/.test(c.nivel) ? c.nivel : 'h2';
    return `<${n}${editable(op, 'contenido.texto')} style="${s}">${escapeHTML(c.texto)}</${n}>`;
  },

  imagen: (c, s, op) => (c.src
    ? `<img src="${escapeHTML(c.src)}" alt="${escapeHTML(c.alt)}" style="max-width:100%;display:block;${s}">`
    : placeholder('Sin imagen todavía', op)),

  boton: (c, s, op) => {
    const texto = escapeHTML(c.texto) || 'Botón';
    if (op.lienzo) return `<span class="ed-editable ed-preview-btn" data-editable-field="contenido.texto" style="${s}">${texto}</span>`;
    return `<a href="${hrefSeguro(c.href)}" style="${BOTON_BASE};${s}">${texto}</a>`;
  },

  video: (c, s, op) => (c.src
    ? `<video src="${escapeHTML(c.src)}" controls style="max-width:100%;display:block;${s}"></video>`
    : placeholder('Sin video todavía', op)),

  icono: (c, s) => {
    const tam = parseInt(c.tamano, 10) || 32;
    return `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="${s}">${ICONOS[c.nombre] || ICONOS.estrella}</svg>`;
  },

  separador: (c, s, op) => `<hr${op.lienzo ? ' class="ed-separador"' : ''} style="border:none;border-top:2px solid #ddd;margin:0;${s}">`,

  espaciador: (c, s, op) => {
    const alto = parseInt(c.alto, 10) || 40;
    return `<div${op.lienzo ? ' class="ed-espaciador"' : ''} style="height:${alto}px;${s}"></div>`;
  },

  galeria: (c, s, op) => {
    const urls = (c.imagenes || '').split('\n').map((u) => u.trim()).filter(Boolean);
    if (!urls.length) return placeholder('Sin imágenes todavía', op);
    const imgs = urls.map((u) => `<img src="${escapeHTML(u)}" alt="" style="width:100%;height:var(--galeria-alto,160px);object-fit:cover;border-radius:6px;display:block">`).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;${s}">${imgs}</div>`;
  },

  formulario: (c, s, op) => {
    const dis = op.lienzo ? ' disabled' : '';
    const boton = op.lienzo
      ? `<span class="ed-preview-btn">${escapeHTML(c.boton) || 'Enviar'}</span>`
      : `<button type="submit" style="${BOTON_BASE};border:0;cursor:pointer">${escapeHTML(c.boton) || 'Enviar'}</button>`;
    return `<form${op.lienzo ? ' class="ed-preview-form"' : ''} style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;${s}" onsubmit="return false">
      <h3 style="margin:0 0 8px">${escapeHTML(c.titulo)}</h3>
      <input type="text" placeholder="Nombre" style="${CAMPO_FORM}"${dis}>
      <input type="email" placeholder="Correo" style="${CAMPO_FORM}"${dis}>
      <textarea placeholder="Mensaje" rows="4" style="${CAMPO_FORM}"${dis}></textarea>
      ${boton}
    </form>`;
  },

  mapa: (c, s, op) => (c.src
    ? `<iframe src="${escapeHTML(c.src)}" loading="lazy" style="width:100%;height:280px;border:0;display:block;${s}"></iframe>`
    : placeholder('Sin mapa todavía — pega una URL de inserción de Google Maps', op)),

  // En el lienzo el contenedor es el propio wrapper .ed-block (el drag &
  // drop necesita que los hijos sean sus hijos directos): devuelve solo
  // los hijos y el wrapper aplica el estilo y las capas de fondo.
  seccion: (c, s, op, hijos, b) => {
    if (op.lienzo) return hijos;
    const capas = capasFondoHTML(b.estilos);
    return capas
      ? `<section style="${CONTENEDOR_CON_CAPAS};${s}">${capas}${hijos}</section>`
      : `<section style="${s}">${hijos}</section>`;
  },
  columnas: (c, s, op, hijos) => (op.lienzo ? hijos : `<div style="display:flex;gap:16px;${s}">${hijos}</div>`),

  ...RENDERERS_AVANZADOS,
};

export const TIPOS_RENDERIZABLES = Object.keys(RENDERERS);

// Video de fondo y capa oscura (overlay) de una sección. Van como hijos
// absolutos con z-index negativo dentro de un contenedor que crea su
// propio contexto de apilamiento (CONTENEDOR_CON_CAPAS): quedan encima
// del color/imagen de fondo del contenedor y debajo de todo su contenido,
// sin tener que envolver a los hijos (lo que rompería el flex/grid del
// contenedor y el drag & drop del lienzo). Orden: video primero, overlay
// después, para que el overlay oscurezca también al video.
export const CONTENEDOR_CON_CAPAS = 'position:relative;z-index:0;overflow:hidden';
const CAPA = 'position:absolute;inset:0;z-index:-1;pointer-events:none';

export function capasFondoHTML(estilos, op = {}) {
  const e = estilos || {};
  const clase = op.lienzo ? ' class="ed-capa-fondo"' : '';
  const capas = [];
  if (e.fondo_tipo === 'video' && e.fondo_video) {
    capas.push(`<video${clase} src="${escapeHTML(e.fondo_video)}" autoplay muted loop playsinline style="${CAPA};width:100%;height:100%;object-fit:cover"></video>`);
  }
  const overlay = Number(e.overlay);
  const conMedio = e.fondo_tipo === 'video' || (e.fondo_imagen && (!e.fondo_tipo || e.fondo_tipo === 'imagen'));
  if (conMedio && overlay > 0) {
    capas.push(`<div${clase} style="${CAPA};background:rgba(0,0,0,${Math.min(overlay, 100) / 100})"></div>`);
  }
  return capas.join('');
}

export function renderBloque(b, hijos = '', opciones = {}) {
  const render = RENDERERS[b.tipo];
  if (!render) return '';
  return render(b.contenido || {}, estilosACSS(b.estilos, b.tipo), opciones, hijos, b);
}
