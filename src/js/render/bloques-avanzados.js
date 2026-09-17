/*
  bloques-avanzados.js
  Renderizadores de los bloques compuestos (testimonial, precio, FAQ,
  producto, redes, código HTML). Misma firma y mismas reglas que
  bloques.js: HTML limpio con estilos inline, igual en lienzo y publicado.
  Las listas (características, preguntas, redes) vienen como JSON string
  en contenido y se leen con parsearLista.
*/

import { REDES } from './iconos-redes.js';
import { sanearHTMLAmplio, escapeHTML, hrefSeguro } from './sanear.js';
import { parsearLista } from './lista.js';

const TARJETA = 'display:flex;flex-direction:column;gap:12px;padding:20px;border:1px solid #e5e5e5;border-radius:12px;background:#fff';
const BOTON = 'display:inline-block;padding:10px 18px;border-radius:8px;background:#FF8A3D;color:#0B0B0F;font-weight:700;font-size:14px;text-decoration:none;align-self:flex-start';

function boton(texto, href, op) {
  const t = escapeHTML(texto) || 'Botón';
  return op.lienzo
    ? `<span class="ed-preview-btn" style="align-self:flex-start">${t}</span>`
    : `<a href="${hrefSeguro(href)}" style="${BOTON}">${t}</a>`;
}

function placeholder(texto, op) {
  return op.lienzo ? `<div class="ed-block-placeholder">${texto}</div>` : '';
}

export const RENDERERS_AVANZADOS = {
  testimonial: (c, s, op) => {
    const foto = c.foto ? `<img src="${escapeHTML(c.foto)}" alt="" style="width:44px;height:44px;border-radius:50%;object-fit:cover">` : '';
    const editable = op.lienzo ? ' class="ed-editable" data-editable-field="contenido.texto"' : '';
    return `<figure style="${TARJETA};margin:0;${s}">
      <blockquote${editable} style="margin:0;font-style:italic;font-size:1.05em">“${escapeHTML(c.texto)}”</blockquote>
      <figcaption style="display:flex;align-items:center;gap:10px">${foto}<div><strong>${escapeHTML(c.autor)}</strong><br><span style="opacity:.7;font-size:13px">${escapeHTML(c.cargo)}</span></div></figcaption>
    </figure>`;
  },

  precio: (c, s, op) => {
    const items = parsearLista(c.caracteristicas).map((f) => `<li style="display:flex;gap:8px;align-items:center"><span style="color:#16a34a">✓</span>${escapeHTML(f.texto)}</li>`).join('');
    return `<div style="${TARJETA};${s}">
      <div style="font-weight:600">${escapeHTML(c.titulo)}</div>
      <div><span style="font-size:2em;font-weight:700">${escapeHTML(c.precio)}</span> <span style="opacity:.7">${escapeHTML(c.periodo)}</span></div>
      ${items ? `<ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px">${items}</ul>` : ''}
      ${boton(c.boton, c.href, op)}
    </div>`;
  },

  faq: (c, s, op) => {
    const items = parsearLista(c.items);
    if (!items.length) return placeholder('Sin preguntas todavía — agrégalas desde el panel', op);
    const detalles = items.map((f) => `<details style="border-bottom:1px solid #e5e5e5;padding:12px 0">
      <summary style="cursor:pointer;font-weight:600">${escapeHTML(f.pregunta)}</summary>
      <p style="margin:8px 0 0;opacity:.85">${escapeHTML(f.respuesta)}</p>
    </details>`).join('');
    return `<div style="${s}">${detalles}</div>`;
  },

  producto: (c, s, op) => {
    const imagen = c.imagen
      ? `<img src="${escapeHTML(c.imagen)}" alt="${escapeHTML(c.nombre)}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;display:block">`
      : (op.lienzo ? '<div class="ed-block-placeholder" style="aspect-ratio:4/3;display:flex;align-items:center;justify-content:center">Sin foto del producto</div>' : '');
    return `<div style="${TARJETA};${s}">
      ${imagen}
      <div style="font-weight:600;font-size:1.1em">${escapeHTML(c.nombre)}</div>
      ${c.descripcion ? `<p style="margin:0;opacity:.8">${escapeHTML(c.descripcion)}</p>` : ''}
      <div style="font-weight:700;font-size:1.3em">${escapeHTML(c.precio)}</div>
      ${boton(c.boton, c.href, op)}
    </div>`;
  },

  redes: (c, s, op) => {
    const items = parsearLista(c.items).filter((f) => REDES[f.red]);
    if (!items.length) return placeholder('Sin redes todavía — agrégalas desde el panel', op);
    const tam = parseInt(c.tamano, 10) || 24;
    const enlaces = items.map((f) => {
      const red = REDES[f.red];
      const svg = `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${red.icono}</svg>`;
      return op.lienzo
        ? `<span title="${red.nombre}" style="display:inline-flex">${svg}</span>`
        : `<a href="${hrefSeguro(f.url)}" target="_blank" rel="noopener" aria-label="${red.nombre}" style="color:inherit;display:inline-flex">${svg}</a>`;
    }).join('');
    return `<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;${s}">${enlaces}</div>`;
  },

  html: (c, s, op) => {
    const html = sanearHTMLAmplio(c.html);
    if (!html.trim()) return placeholder('Pega tu código HTML en el panel', op);
    return `<div style="${s}">${html}</div>`;
  },
};
