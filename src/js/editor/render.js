/*
  render.js
  Pinta el lienzo y el panel de Capas a partir de `state`. El HTML de cada
  bloque sale del renderizador compartido (src/js/render/bloques.js) en
  modo lienzo; acá solo se agregan las cosas propias del editor: el
  wrapper .ed-block con su manija de arrastre, la selección y el estado
  vacío de cada zona. No muta el estado ni conoce la red.
*/

import { state, ZONAS, ETIQUETAS_ZONA, CONTENEDORES, ETIQUETAS } from './state.js';
import { renderBloque } from '../render/bloques.js';
import { estilosACSS } from '../render/css.js';
import { hijosDe, raicesDeZona } from '../render/arbol.js';
import { zonaVaciaHTML } from './zonas.js';

export { renderPropiedades } from './propiedades/panel.js';

const MANIJA = `<span class="ed-drag-handle" draggable="true" title="Arrastrar para reordenar">
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
</span>`;

function renderNodo(b) {
  const esContenedor = CONTENEDORES.has(b.tipo);
  const hijos = hijosDe(state.blocks, b.id).map(renderNodo).join('');

  let interior;
  if (esContenedor) {
    interior = hijos || `<div class="ed-contenedor-vacio">Selecciona esta ${ETIQUETAS[b.tipo].toLowerCase()} y agrega bloques desde el panel</div>`;
  } else {
    interior = renderBloque(b, '', { lienzo: true });
  }

  const clases = ['ed-block'];
  if (esContenedor) clases.push(b.tipo === 'columnas' ? 'ed-contenedor ed-contenedor--columnas' : 'ed-contenedor');
  if (b.id === state.selectedId) clases.push('is-selected');

  // El contenedor no tiene elemento propio en el lienzo (los hijos deben
  // ser hijos directos del wrapper para el drag & drop), así que su
  // estilo va en el wrapper.
  const estilo = esContenedor ? ` style="${estilosACSS(b.estilos, b.tipo)}"` : '';
  return `<div class="${clases.join(' ')}" data-block-id="${b.id}"${estilo}>${MANIJA}${interior}</div>`;
}

function renderZonaBloques(zona) {
  const mount = document.querySelector(`[data-zone-blocks="${zona}"]`);
  if (!mount) return;
  const raices = raicesDeZona(state.blocks, zona);
  mount.innerHTML = raices.length ? raices.map(renderNodo).join('') : zonaVaciaHTML(zona);
}

// Solo actualiza clases (selección, zona activa) sin tocar el innerHTML de
// los bloques: reemplazar el nodo bajo el cursor entre el primer y segundo
// clic de un doble clic le impide a Chromium reconocerlo como "dblclick".
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

function filasCapas(parentId, zona, profundidad) {
  return state.blocks
    .filter((b) => b.zona === zona && b.parent_id === parentId)
    .sort((a, z) => a.orden - z.orden)
    .map((b) => `<div class="ed-capa-fila" data-block-id="${b.id}" style="padding-left:${profundidad * 14}px">${ETIQUETAS[b.tipo]}</div>`
      + filasCapas(b.id, zona, profundidad + 1))
    .join('');
}

export function renderCapas() {
  const cont = document.getElementById('layersTree');
  if (!cont) return;
  cont.innerHTML = ZONAS.map((zona) => `
    <div class="ed-capa-zona">
      <div class="ed-capa-zona-titulo">${ETIQUETAS_ZONA[zona]}</div>
      ${filasCapas(null, zona, 0) || '<p class="ed-capa-vacio">Vacío</p>'}
    </div>`).join('');
}

export function renderCanvas() {
  ZONAS.forEach(renderZonaBloques);
  actualizarEstadosVisuales();
  renderCapas();
}
