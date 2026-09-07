/*
  render.js
  Pinta el lienzo y el panel de propiedades a partir de `state`. No muta
  el estado ni conoce la red — solo lee y escribe DOM.
*/

import { state, ZONAS, CONTENEDORES, ETIQUETAS, CAMPOS, leerCampo } from './state.js';

const MAPA_ESTILOS = { color: 'color', fondo: 'background' };

function estiloInline(estilos) {
  return Object.entries(estilos || {})
    .filter(([k, v]) => MAPA_ESTILOS[k] && v)
    .map(([k, v]) => `${MAPA_ESTILOS[k]}:${v}`)
    .join(';');
}

export function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderContenido(b) {
  const s = estiloInline(b.estilos);
  const c = b.contenido;
  switch (b.tipo) {
    case 'texto':
      return `<div class="ed-editable" data-editable-field="contenido.html" style="${s}">${c.html || ''}</div>`;
    case 'titulo': {
      const n = c.nivel || 'h2';
      return `<${n} class="ed-editable" data-editable-field="contenido.texto" style="${s}">${escapeHTML(c.texto)}</${n}>`;
    }
    case 'imagen':
      return c.src
        ? `<img src="${escapeHTML(c.src)}" alt="${escapeHTML(c.alt)}" style="max-width:100%;display:block;${s}">`
        : `<div class="ed-block-placeholder">Sin imagen todavía</div>`;
    case 'boton':
      return `<span class="ed-editable ed-preview-btn" data-editable-field="contenido.texto" style="${s}">${escapeHTML(c.texto) || 'Botón'}</span>`;
    case 'video':
      return c.src
        ? `<video src="${escapeHTML(c.src)}" controls style="max-width:100%;${s}"></video>`
        : `<div class="ed-block-placeholder">Sin video todavía</div>`;
    default:
      return '';
  }
}

function renderNodo(b) {
  const hijos = state.blocks
    .filter((x) => x.parent_id === b.id)
    .sort((x, y) => x.orden - y.orden)
    .map(renderNodo)
    .join('');

  const esContenedor = CONTENEDORES.has(b.tipo);
  let interior;
  if (esContenedor) {
    interior = hijos || `<div class="ed-contenedor-vacio">Selecciona esta ${ETIQUETAS[b.tipo].toLowerCase()} y agrega bloques desde el panel</div>`;
  } else {
    interior = renderContenido(b);
  }

  const clases = ['ed-block'];
  if (esContenedor) clases.push(b.tipo === 'columnas' ? 'ed-contenedor ed-contenedor--columnas' : 'ed-contenedor');
  if (b.id === state.selectedId) clases.push('is-selected');

  return `<div class="${clases.join(' ')}" data-block-id="${b.id}">${interior}</div>`;
}

function renderZonaBloques(zona) {
  const mount = document.querySelector(`[data-zone-blocks="${zona}"]`);
  if (!mount) return;

  const raices = state.blocks
    .filter((b) => b.zona === zona && b.parent_id === null)
    .sort((a, z) => a.orden - z.orden);

  if (raices.length === 0) {
    mount.innerHTML = `
      <div class="ed-zone-empty">
        <div class="icon-frame icon-frame--24">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M4 12h16"/></svg>
        </div>
        <p class="ed-zone-empty-text">Elige un bloque del panel para empezar</p>
      </div>`;
    return;
  }

  mount.innerHTML = raices.map(renderNodo).join('');
}

// Solo actualiza clases (selección, zona activa) sin tocar el innerHTML de
// los bloques: reemplazar el nodo bajo el cursor entre el primer y segundo
// clic de un doble clic le impide a Chromium reconocerlo como "dblclick"
// (cuenta el clic de nuevo desde cero si el elemento cambió de identidad).
export function actualizarEstadosVisuales() {
  document.querySelectorAll('.ed-block').forEach((el) => {
    el.classList.toggle('is-selected', Number(el.dataset.blockId) === state.selectedId);
  });
  document.querySelectorAll('.ed-zone').forEach((el) => {
    el.classList.toggle('is-target', el.dataset.zona === state.zonaActiva);
  });
}

export function renderCanvas() {
  ZONAS.forEach(renderZonaBloques);
  actualizarEstadosVisuales();
}

function campoHTML(bloque, campo) {
  const valor = leerCampo(bloque, campo.key);
  if (campo.type === 'textarea') {
    return `<label>${campo.label}</label><textarea data-campo="${campo.key}">${escapeHTML(valor)}</textarea>`;
  }
  if (campo.type === 'select') {
    const opciones = campo.opciones
      .map((o) => `<option value="${o}"${o === valor ? ' selected' : ''}>${o.toUpperCase()}</option>`)
      .join('');
    return `<label>${campo.label}</label><select data-campo="${campo.key}">${opciones}</select>`;
  }
  return `<label>${campo.label}</label><input type="text" data-campo="${campo.key}" value="${escapeHTML(valor)}">`;
}

export function renderPropiedades() {
  const cont = document.getElementById('propertiesBody');
  if (!cont) return;

  const bloque = state.blocks.find((b) => b.id === state.selectedId);
  if (!bloque) {
    cont.innerHTML = `
      <div class="ed-properties-empty">
        <div class="icon-frame icon-frame--36">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51z"/></svg>
        </div>
        <p class="ed-properties-empty-text">Selecciona un bloque en el lienzo para editar sus propiedades</p>
      </div>`;
    return;
  }

  const esContenedor = CONTENEDORES.has(bloque.tipo);
  const campos = (CAMPOS[bloque.tipo] || []).map((c) => campoHTML(bloque, c)).join('');
  const notaContenedor = esContenedor
    ? `<p class="ed-container-hint">${ETIQUETAS[bloque.tipo]}: los bloques que agregues desde el panel entran aquí dentro.</p>`
    : '';

  cont.innerHTML = `
    <div class="ed-properties-type">${ETIQUETAS[bloque.tipo]}</div>
    ${notaContenedor}
    ${campos}
    <div class="ed-field-group">
      <label>Color de texto</label>
      <input type="text" data-campo="estilos.color" value="${escapeHTML(bloque.estilos.color)}" placeholder="#f2f2f5">
      <label>Fondo</label>
      <input type="text" data-campo="estilos.fondo" value="${escapeHTML(bloque.estilos.fondo)}" placeholder="transparent">
    </div>
    <button type="button" class="ed-btn ed-btn--secondary ed-delete-btn" data-accion="eliminar">Eliminar bloque</button>
  `;
}
