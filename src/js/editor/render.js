/*
  render.js
  Pinta el lienzo y el panel de propiedades a partir de `state`. No muta
  el estado ni conoce la red — solo lee y escribe DOM.
*/

import {
  state, ZONAS, ETIQUETAS_ZONA, CONTENEDORES, ETIQUETAS, CAMPOS, CAMPOS_ESTILO,
  PESOS, ALINEACIONES, SOMBRAS, ICONOS, leerCampo, sanearHTML,
} from './state.js';

// Cada campo de estilo se traduce a CSS por su cuenta (no un mapeo
// genérico clave→propiedad): "peso"/"alineacion"/"sombra" guardan una
// clave legible que hay que resolver, y "borde" solo tiene efecto si
// además se define un estilo de borde.
function estiloInline(estilos) {
  const e = estilos || {};
  const partes = [];
  if (e.color) partes.push(`color:${e.color}`);
  if (e.fondo) partes.push(`background:${e.fondo}`);
  if (e.fuente) partes.push(`font-family:'${e.fuente}',sans-serif`);
  if (e.tamano) partes.push(`font-size:${e.tamano}px`);
  if (e.peso && PESOS[e.peso]) partes.push(`font-weight:${PESOS[e.peso]}`);
  if (e.alineacion && ALINEACIONES[e.alineacion]) partes.push(`text-align:${ALINEACIONES[e.alineacion]}`);
  if (e.borde) {
    partes.push('border-style:solid', `border-width:${e.borde}px`, `border-color:${e.borde_color || '#000'}`);
  }
  if (e.radio) partes.push(`border-radius:${e.radio}px`);
  if (e.sombra && SOMBRAS[e.sombra]) partes.push(`box-shadow:${SOMBRAS[e.sombra]}`);
  return partes.join(';');
}

export function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderContenido(b) {
  const s = estiloInline(b.estilos);
  const c = b.contenido;
  switch (b.tipo) {
    case 'texto':
      // Defensa en dos capas: escribirCampo ya sanea al guardar, pero un
      // bloque cargado desde Neon llega directo aquí sin pasar por ahí.
      return `<div class="ed-editable" data-editable-field="contenido.html" style="${s}">${sanearHTML(c.html)}</div>`;
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
    case 'icono': {
      const tam = parseInt(c.tamano, 10) || 32;
      const svgInterior = ICONOS[c.nombre] || ICONOS.estrella;
      return `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="${s}">${svgInterior}</svg>`;
    }
    case 'separador':
      return `<hr class="ed-separador" style="${s}">`;
    case 'espaciador': {
      const alto = parseInt(c.alto, 10) || 40;
      return `<div class="ed-espaciador" style="height:${alto}px;${s}"></div>`;
    }
    case 'galeria': {
      const urls = (c.imagenes || '').split('\n').map((u) => u.trim()).filter(Boolean);
      return urls.length
        ? `<div class="ed-galeria" style="${s}">${urls.map((u) => `<img src="${escapeHTML(u)}" alt="">`).join('')}</div>`
        : `<div class="ed-block-placeholder">Sin imágenes todavía</div>`;
    }
    case 'formulario':
      // Vista previa nada más: todavía no hay a dónde enviar el formulario
      // (falta el endpoint que reciba estos envíos), así que queda
      // deshabilitado para no aparentar que ya funciona.
      return `
        <form class="ed-preview-form" style="${s}">
          <h3>${escapeHTML(c.titulo)}</h3>
          <input type="text" placeholder="Nombre" disabled>
          <input type="email" placeholder="Correo" disabled>
          <textarea placeholder="Mensaje" disabled></textarea>
          <span class="ed-preview-btn">${escapeHTML(c.boton) || 'Enviar'}</span>
        </form>`;
    case 'mapa':
      return c.src
        ? `<iframe src="${escapeHTML(c.src)}" class="ed-mapa" style="${s}" loading="lazy"></iframe>`
        : `<div class="ed-block-placeholder">Sin mapa todavía — pega una URL de inserción de Google Maps</div>`;
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

  const manija = `<span class="ed-drag-handle" draggable="true" title="Arrastrar para reordenar">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
  </span>`;

  return `<div class="${clases.join(' ')}" data-block-id="${b.id}">${manija}${interior}</div>`;
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
  document.querySelectorAll('.ed-capa-fila').forEach((el) => {
    el.classList.toggle('is-selected', Number(el.dataset.blockId) === state.selectedId);
  });
}

// --- Panel de Capas: el mismo árbol de bloques, en forma de lista ---

function filaCapa(b, profundidad) {
  return `<div class="ed-capa-fila" data-block-id="${b.id}" style="padding-left:${profundidad * 14}px">${ETIQUETAS[b.tipo]}</div>`;
}

function filasCapasHijos(parentId, zona, profundidad) {
  return state.blocks
    .filter((b) => b.zona === zona && b.parent_id === parentId)
    .sort((a, z) => a.orden - z.orden)
    .map((b) => filaCapa(b, profundidad) + filasCapasHijos(b.id, zona, profundidad + 1))
    .join('');
}

export function renderCapas() {
  const cont = document.getElementById('layersTree');
  if (!cont) return;
  cont.innerHTML = ZONAS.map((zona) => {
    const filas = filasCapasHijos(null, zona, 0);
    return `
      <div class="ed-capa-zona">
        <div class="ed-capa-zona-titulo">${ETIQUETAS_ZONA[zona]}</div>
        ${filas || '<p class="ed-capa-vacio">Vacío</p>'}
      </div>`;
  }).join('');
}

export function renderCanvas() {
  ZONAS.forEach(renderZonaBloques);
  actualizarEstadosVisuales();
  renderCapas();
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
  const placeholder = campo.placeholder ? ` placeholder="${campo.placeholder}"` : '';
  return `<label>${campo.label}</label><input type="text" data-campo="${campo.key}" value="${escapeHTML(valor)}"${placeholder}>`;
}

function campoEstiloGrupo(bloque, nombreGrupo) {
  const campos = CAMPOS_ESTILO.filter((c) => c.grupo === nombreGrupo).map((c) => campoHTML(bloque, c)).join('');
  return `<div class="ed-field-group"><p class="ed-field-group-titulo">${nombreGrupo}</p>${campos}</div>`;
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
    ${campoEstiloGrupo(bloque, 'Color')}
    ${campoEstiloGrupo(bloque, 'Tipografía')}
    ${campoEstiloGrupo(bloque, 'Forma')}
    <button type="button" class="ed-btn ed-btn--secondary ed-delete-btn" data-accion="eliminar">Eliminar bloque</button>
  `;
}
