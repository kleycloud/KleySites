/*
  panel.js
  Pinta el panel de propiedades del bloque seleccionado en tres pestañas:
  Contenido (campos de CATALOGO_BLOQUES), Estilo (grupos de por-tipo.js
  como acordeones que recuerdan si estaban cerrados) y Avanzado. Solo se
  renderiza la pestaña activa; se recuerda cuál es entre bloques. Solo
  lee `state`; los eventos viven en eventos.js.
*/

import { state, CONTENEDORES, ETIQUETAS, CAMPOS } from '../state.js';
import { controlHTML } from './controles.js';
import { gruposParaTipo } from './por-tipo.js';
import { AVANZADO } from './grupos.js';

const PESTANAS = [['contenido', 'Contenido'], ['estilo', 'Estilo'], ['avanzado', 'Avanzado']];

const gruposCerrados = new Set();
let pestanaActiva = 'contenido';

export function marcarGrupo(id, abierto) {
  if (abierto) gruposCerrados.delete(id); else gruposCerrados.add(id);
}

export function marcarPestana(id) {
  pestanaActiva = id;
}

function grupoHTML(bloque, grupo) {
  const abierto = gruposCerrados.has(grupo.id) ? '' : ' open';
  return `
    <details class="ed-prop-grupo" data-grupo="${grupo.id}"${abierto}>
      <summary class="ed-field-group-titulo">${grupo.titulo}</summary>
      ${grupo.campos.map((c) => controlHTML(bloque, c)).join('')}
    </details>`;
}

function pestanasHTML() {
  return `<div class="ed-prop-tabs">${PESTANAS.map(([id, nombre]) =>
    `<button type="button" class="ed-prop-tab${id === pestanaActiva ? ' is-active' : ''}" data-tab="${id}">${nombre}</button>`).join('')}</div>`;
}

function cuerpoContenido(bloque) {
  const notaContenedor = CONTENEDORES.has(bloque.tipo)
    ? `<p class="ed-container-hint">${ETIQUETAS[bloque.tipo]}: los bloques que agregues desde el panel entran aquí dentro.</p>`
    : '';
  const contenido = (CAMPOS[bloque.tipo] || []).map((c) => controlHTML(bloque, c)).join('');
  if (!contenido && !notaContenedor) {
    return '<p class="ed-prop-vacio">Este bloque no tiene texto ni datos para cambiar — lo que se ve se ajusta en la pestaña Estilo.</p>';
  }
  return `${notaContenedor}${contenido ? `<div class="ed-prop-contenido">${contenido}</div>` : ''}`;
}

function cuerpoEstilo(bloque) {
  return gruposParaTipo(bloque.tipo).map((g) => grupoHTML(bloque, g)).join('');
}

function cuerpoAvanzado(bloque) {
  return `${grupoHTML(bloque, AVANZADO)}
    <button type="button" class="ed-btn ed-btn--secondary ed-delete-btn" data-accion="eliminar">Eliminar bloque</button>`;
}

const CUERPOS = { contenido: cuerpoContenido, estilo: cuerpoEstilo, avanzado: cuerpoAvanzado };

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

  cont.innerHTML = `
    <div class="ed-properties-type">${ETIQUETAS[bloque.tipo]}</div>
    ${pestanasHTML()}
    <div class="ed-prop-cuerpo" data-cuerpo="${pestanaActiva}">${CUERPOS[pestanaActiva](bloque)}</div>
  `;
}
