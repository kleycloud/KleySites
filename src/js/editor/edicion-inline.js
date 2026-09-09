/*
  edicion-inline.js
  Doble clic sobre un bloque en el lienzo para editarlo ahí mismo, como en
  un documento. Mismo historial y autoguardado que el panel de
  propiedades, pero sin renderCanvas() en cada tecleo: reemplazaría el
  nodo contenteditable bajo el cursor y perdería el foco a media edición.
*/

import { state, escribirCampo } from './state.js';
import { registrarEdicionDebounced } from './history.js';
import { programarGuardado } from './sync.js';
import { renderCanvas, renderPropiedades } from './render.js';
import { seleccionarBloque } from './bloques.js';

const CAMPOS_TEXTO_PLANO = new Set(['contenido.texto']); // sin saltos de línea (título, botón)

function escribirCampoSinRender(id, path, valor) {
  const bloque = state.blocks.find((b) => b.id === id);
  if (!bloque) return;
  registrarEdicionDebounced();
  escribirCampo(bloque, path, valor);
  programarGuardado();
}

function iniciarEdicionInline(elInicial) {
  const blockEl = elInicial.closest('[data-block-id]');
  if (!blockEl) return;
  const id = Number(blockEl.dataset.blockId);
  const path = elInicial.dataset.editableField;

  seleccionarBloque(id); // no re-renderiza el bloque (ver actualizarEstadosVisuales)

  const elFresco = document.querySelector(`[data-block-id="${id}"][data-editable-field="${path}"]`)
    || document.querySelector(`[data-block-id="${id}"] [data-editable-field="${path}"]`);
  if (!elFresco) return;

  state.editandoInline = { id, path, el: elFresco };
  elFresco.setAttribute('contenteditable', 'true');
  elFresco.classList.add('is-editing');
  elFresco.focus();

  const seleccion = window.getSelection();
  const rango = document.createRange();
  rango.selectNodeContents(elFresco);
  seleccion.removeAllRanges();
  seleccion.addRange(rango);
}

function finalizarEdicionInline() {
  if (!state.editandoInline) return;
  const { el } = state.editandoInline;
  el.removeAttribute('contenteditable');
  el.classList.remove('is-editing');
  state.editandoInline = null;
  renderCanvas();
  renderPropiedades();
}

export function estaEditandoInline(el) {
  return state.editandoInline != null && state.editandoInline.el.contains(el);
}

export function initEdicionInline(canvasWrap) {
  canvasWrap.addEventListener('dblclick', (e) => {
    const editable = e.target.closest('[data-editable-field]');
    if (!editable) return;
    e.stopPropagation();
    iniciarEdicionInline(editable);
  });

  canvasWrap.addEventListener('input', (e) => {
    if (!state.editandoInline || e.target !== state.editandoInline.el) return;
    const { id, path } = state.editandoInline;
    const valor = CAMPOS_TEXTO_PLANO.has(path) ? e.target.textContent : e.target.innerHTML;
    escribirCampoSinRender(id, path, valor);
  });

  canvasWrap.addEventListener('keydown', (e) => {
    if (!state.editandoInline || e.target !== state.editandoInline.el) return;
    if (e.key === 'Escape') { e.preventDefault(); e.target.blur(); return; }
    if (e.key === 'Enter' && CAMPOS_TEXTO_PLANO.has(state.editandoInline.path)) {
      e.preventDefault();
      e.target.blur();
    }
  });

  canvasWrap.addEventListener('paste', (e) => {
    if (!state.editandoInline || e.target !== state.editandoInline.el) return;
    if (!CAMPOS_TEXTO_PLANO.has(state.editandoInline.path)) return;
    e.preventDefault();
    const texto = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, texto);
  });

  canvasWrap.addEventListener('blur', (e) => {
    if (state.editandoInline && e.target === state.editandoInline.el) finalizarEdicionInline();
  }, true);
}
