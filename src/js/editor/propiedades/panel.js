/*
  panel.js
  Pinta el panel de propiedades del bloque seleccionado: campos de
  contenido (CATALOGO_BLOQUES) y los grupos de estilo que corresponden a
  ese tipo (por-tipo.js), como acordeones que recuerdan si estaban
  cerrados. Solo lee `state`; los eventos viven en eventos.js.
*/

import { state, CONTENEDORES, ETIQUETAS, CAMPOS } from '../state.js';
import { controlHTML } from './controles.js';
import { gruposParaTipo } from './por-tipo.js';

const gruposCerrados = new Set();

export function marcarGrupo(id, abierto) {
  if (abierto) gruposCerrados.delete(id); else gruposCerrados.add(id);
}

function grupoHTML(bloque, grupo) {
  const abierto = gruposCerrados.has(grupo.id) ? '' : ' open';
  return `
    <details class="ed-prop-grupo" data-grupo="${grupo.id}"${abierto}>
      <summary class="ed-field-group-titulo">${grupo.titulo}</summary>
      ${grupo.campos.map((c) => controlHTML(bloque, c)).join('')}
    </details>`;
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

  const notaContenedor = CONTENEDORES.has(bloque.tipo)
    ? `<p class="ed-container-hint">${ETIQUETAS[bloque.tipo]}: los bloques que agregues desde el panel entran aquí dentro.</p>`
    : '';
  const contenido = (CAMPOS[bloque.tipo] || []).map((c) => controlHTML(bloque, c)).join('');

  cont.innerHTML = `
    <div class="ed-properties-type">${ETIQUETAS[bloque.tipo]}</div>
    ${notaContenedor}
    ${contenido ? `<div class="ed-prop-contenido">${contenido}</div>` : ''}
    ${gruposParaTipo(bloque.tipo).map((g) => grupoHTML(bloque, g)).join('')}
    <button type="button" class="ed-btn ed-btn--secondary ed-delete-btn" data-accion="eliminar">Eliminar bloque</button>
  `;
}
