/*
  arrastrar.js
  Conecta los eventos nativos de drag & drop del lienzo con la geometría
  pura de dragdrop.js y la mutación de estado de bloques.js.
*/

import { state } from './state.js';
import { contenedorDestino, datosDestino, indiceDeInsercion } from './dragdrop.js';
import { moverBloque, formaCiclo } from './bloques.js';

let arrastrando = null; // id del bloque que se está arrastrando
let indicador = null; // <div class="ed-drop-indicator"> insertado mientras se arrastra encima

function limpiarIndicadorArrastre() {
  if (indicador) { indicador.remove(); indicador = null; }
  document.querySelectorAll('.ed-contenedor.is-drop-target').forEach((el) => el.classList.remove('is-drop-target'));
}

function calcularDestinoArrastre(e) {
  if (arrastrando == null) return null;
  const contenedorEl = contenedorDestino(e.target);
  if (!contenedorEl) return null;
  const { zona, parentId } = datosDestino(contenedorEl, state.blocks);
  if (zona == null || arrastrando === parentId || formaCiclo(arrastrando, parentId)) return null;
  const horizontal = contenedorEl.classList.contains('ed-contenedor--columnas');
  const indice = indiceDeInsercion(contenedorEl, arrastrando, e.clientX, e.clientY, horizontal);
  return { contenedorEl, zona, parentId, indice };
}

export function initArrastre(canvasWrap) {
  // La manija (.ed-drag-handle) es lo único con draggable="true" — el
  // bloque completo no, para no chocar con la selección de texto y la
  // edición directa por doble clic.
  canvasWrap.addEventListener('dragstart', (e) => {
    const manija = e.target.closest('.ed-drag-handle');
    const bloqueEl = manija && manija.closest('[data-block-id]');
    if (!bloqueEl) { e.preventDefault(); return; }
    arrastrando = Number(bloqueEl.dataset.blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(arrastrando)); // Firefox exige setData para permitir el arrastre
    e.dataTransfer.setDragImage(bloqueEl, 16, 16);
    bloqueEl.classList.add('is-dragging');
  });

  canvasWrap.addEventListener('dragover', (e) => {
    // Primero quitar el indicador de la vuelta anterior: si sigue en el
    // DOM mientras se miden las posiciones de los bloques, sus 3px de
    // alto corren el layout y desalinean el índice calculado.
    limpiarIndicadorArrastre();
    const destino = calcularDestinoArrastre(e);
    if (!destino) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (destino.contenedorEl.classList.contains('ed-contenedor')) destino.contenedorEl.classList.add('is-drop-target');

    indicador = document.createElement('div');
    indicador.className = 'ed-drop-indicator';
    const hijos = [...destino.contenedorEl.children].filter(
      (el) => el.matches('.ed-block') && Number(el.dataset.blockId) !== arrastrando,
    );
    if (destino.indice >= hijos.length) destino.contenedorEl.appendChild(indicador);
    else destino.contenedorEl.insertBefore(indicador, hijos[destino.indice]);
  });

  canvasWrap.addEventListener('drop', (e) => {
    e.preventDefault();
    limpiarIndicadorArrastre();
    const destino = calcularDestinoArrastre(e);
    if (destino) moverBloque(arrastrando, destino.zona, destino.parentId, destino.indice);
    arrastrando = null;
  });

  canvasWrap.addEventListener('dragend', () => {
    document.querySelectorAll('.ed-block.is-dragging').forEach((el) => el.classList.remove('is-dragging'));
    limpiarIndicadorArrastre();
    arrastrando = null;
  });
}
