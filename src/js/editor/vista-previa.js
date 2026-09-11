/*
  vista-previa.js
  Botón "Vista previa": renderiza el estado actual del lienzo (aunque no
  se haya guardado todavía) como HTML final y lo abre en una pestaña
  nueva. Sin backend — por eso el mapeo de estilos/tipos está duplicado
  del renderizador real (server/lib/render.js): son dos runtimes
  distintos, no hay forma de compartir el código entre ambos.
*/

import { state } from './state.js';
import { obtenerPerfil } from '../api.js';

const BADGE_HTML = '<a href="https://kleysites.com" target="_blank" rel="noopener" style="position:fixed;bottom:12px;right:12px;background:#0b0b0f;color:#fff;font:12px system-ui,sans-serif;padding:6px 10px;border-radius:8px;text-decoration:none;opacity:.85;z-index:9999;">Hecho con KleySites</a>';

const PESOS = { normal: '400', medio: '500', semibold: '600', negrita: '700', extra: '800' };
const ALINEACIONES = { izquierda: 'left', centro: 'center', derecha: 'right' };
const SOMBRAS = {
  ninguna: '', sutil: '0 1px 3px rgba(0,0,0,.12)', media: '0 4px 12px rgba(0,0,0,.18)', fuerte: '0 8px 24px rgba(0,0,0,.28)',
};

function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function estiloInline(e) {
  e = e || {};
  const partes = [];
  if (e.color) partes.push(`color:${e.color}`);
  if (e.fondo) partes.push(`background:${e.fondo}`);
  if (e.fuente) partes.push(`font-family:'${e.fuente}',sans-serif`);
  if (e.tamano) partes.push(`font-size:${e.tamano}px`);
  if (e.peso && PESOS[e.peso]) partes.push(`font-weight:${PESOS[e.peso]}`);
  if (e.alineacion && ALINEACIONES[e.alineacion]) partes.push(`text-align:${ALINEACIONES[e.alineacion]}`);
  if (e.borde) partes.push('border-style:solid', `border-width:${e.borde}px`, `border-color:${e.borde_color || '#000'}`);
  if (e.radio) partes.push(`border-radius:${e.radio}px`);
  if (e.sombra && SOMBRAS[e.sombra]) partes.push(`box-shadow:${SOMBRAS[e.sombra]}`);
  return partes.join(';');
}

const renderers = {
  texto: (c, s) => `<div style="${s}">${c.html || ''}</div>`,
  titulo: (c, s) => { const n = c.nivel || 'h2'; return `<${n} style="${s}">${escapeHTML(c.texto)}</${n}>`; },
  imagen: (c, s) => (c.src ? `<img src="${escapeHTML(c.src)}" alt="${escapeHTML(c.alt)}" style="max-width:100%;display:block;${s}">` : ''),
  boton: (c, s) => `<a href="${escapeHTML(c.href || '#')}" style="display:inline-block;padding:10px 18px;${s}">${escapeHTML(c.texto) || 'Botón'}</a>`,
  icono: (c, s) => `<span style="${s}">${escapeHTML(c.nombre || '')}</span>`,
  separador: (c, s) => `<hr style="${s}">`,
  espaciador: (c, s) => `<div style="height:${parseInt(c.alto, 10) || 40}px;${s}"></div>`,
  video: (c, s) => (c.src ? `<video src="${escapeHTML(c.src)}" controls style="max-width:100%;${s}"></video>` : ''),
  galeria: (c, s) => {
    const urls = (c.imagenes || '').split('\n').map((u) => u.trim()).filter(Boolean);
    return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;${s}">${urls.map((u) => `<img src="${escapeHTML(u)}" alt="" style="width:100%;height:110px;object-fit:cover;">`).join('')}</div>`;
  },
  formulario: (c, s) => `<form style="${s}"><h3>${escapeHTML(c.titulo)}</h3><input type="text" placeholder="Nombre"><input type="email" placeholder="Correo"><textarea placeholder="Mensaje"></textarea><button type="button">${escapeHTML(c.boton) || 'Enviar'}</button></form>`,
  mapa: (c, s) => (c.src ? `<iframe src="${escapeHTML(c.src)}" style="width:100%;height:280px;border:0;${s}" loading="lazy"></iframe>` : ''),
  seccion: (c, s, hijos) => `<section style="${s}">${hijos}</section>`,
  columnas: (c, s, hijos) => `<div style="display:flex;gap:16px;${s}">${hijos}</div>`,
};

function renderBloque(b, porPadre) {
  const s = estiloInline(b.estilos);
  const hijos = (porPadre[b.id] || [])
    .sort((a, z) => a.orden - z.orden)
    .map((h) => renderBloque(h, porPadre))
    .join('\n');
  const render = renderers[b.tipo];
  return render ? render(b.contenido, s, hijos) : '';
}

function generarHTML(nombreSitio, conBadge) {
  const porPadre = {};
  state.blocks.forEach((b) => {
    if (b.parent_id != null) (porPadre[b.parent_id] = porPadre[b.parent_id] || []).push(b);
  });
  const raices = state.blocks.filter((b) => b.parent_id == null);
  const porZona = { encabezado: [], contenido: [], pie: [] };
  raices.forEach((b) => (porZona[b.zona] || porZona.contenido).push(b));

  const zona = (lista) => lista.sort((a, z) => a.orden - z.orden).map((b) => renderBloque(b, porPadre)).join('\n');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHTML(nombreSitio || 'Vista previa')}</title></head><body>
<header>${zona(porZona.encabezado)}</header>
<main>${zona(porZona.contenido)}</main>
<footer>${zona(porZona.pie)}</footer>
${conBadge ? BADGE_HTML : ''}
</body></html>`;
}

export function initVistaPrevia() {
  document.getElementById('btnVistaPrevia').addEventListener('click', async () => {
    // Se abre la pestaña primero, sincrónico con el clic — si se espera a
    // obtener el plan antes de abrir, algunos navegadores (Safari sobre
    // todo) bloquean la ventana por no verla como resultado directo del clic.
    const popup = window.open('', '_blank');

    let plan = 'gratis';
    try {
      const resp = await obtenerPerfil();
      plan = resp.perfil.plan || 'gratis';
    } catch (e) {
      console.error('No se pudo obtener el plan', e);
    }

    const nombre = document.getElementById('siteName').textContent;
    const html = generarHTML(nombre, plan !== 'pro');
    if (popup) {
      popup.document.write(html);
      popup.document.close();
    }
  });
}
