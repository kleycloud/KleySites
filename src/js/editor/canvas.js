/*
  canvas.js
  Controlador del editor: conecta el estado (state.js), el historial
  (history.js), el autoguardado (sync.js) y el render (render.js) con los
  eventos del DOM. No contiene reglas de negocio propias más allá de esa
  orquestación.
*/

import * as api from '../api.js';
import { initAccountMenu } from '../account-menu.js';
import { state, CONTENEDORES, CONTENIDO_INICIAL, escribirCampo } from './state.js';
import { guardarSnapshot, registrarEdicionDebounced, deshacer as deshacerHistorial, rehacer as rehacerHistorial } from './history.js';
import { marcarEstado, programarGuardado } from './sync.js';
import { renderCanvas, renderPropiedades, actualizarEstadosVisuales } from './render.js';

// Sin sesión, no hay editor: se necesita el token para leer/guardar en Neon.
if (!localStorage.getItem('kleysites_token')) {
  window.location.href = '/';
}

initAccountMenu(document.getElementById('btnCuentaEditor'), document.getElementById('menuCuentaEditor'));
document.getElementById('btnVolverDashboard').addEventListener('click', () => {
  window.location.href = '/dashboard.html';
});

function deshacer() {
  if (!deshacerHistorial()) return;
  renderCanvas();
  renderPropiedades();
  programarGuardado();
}

function rehacer() {
  if (!rehacerHistorial()) return;
  renderCanvas();
  renderPropiedades();
  programarGuardado();
}

function crearBloque(tipo) {
  guardarSnapshot();

  const seleccionado = state.blocks.find((b) => b.id === state.selectedId);
  const enContenedor = seleccionado && CONTENEDORES.has(seleccionado.tipo) && seleccionado.zona === state.zonaActiva;
  const parentId = enContenedor ? seleccionado.id : null;
  const zona = state.zonaActiva;
  const hermanos = state.blocks.filter((b) => b.parent_id === parentId && b.zona === zona);

  state.blocks.push({
    id: state.nextId++,
    remoteId: null,
    tipo,
    contenido: structuredClone(CONTENIDO_INICIAL[tipo] || {}),
    estilos: {},
    zona,
    parent_id: parentId,
    orden: hermanos.length,
  });
  state.selectedId = state.blocks[state.blocks.length - 1].id;
  renderCanvas();
  renderPropiedades();
  programarGuardado();
}

function seleccionarBloque(id) {
  const bloque = state.blocks.find((b) => b.id === id);
  if (bloque) state.zonaActiva = bloque.zona;
  state.selectedId = id;
  actualizarEstadosVisuales();
  renderPropiedades();
}

function activarZona(zona) {
  state.zonaActiva = zona;
  state.selectedId = null;
  actualizarEstadosVisuales();
  renderPropiedades();
}

function deseleccionar() {
  state.selectedId = null;
  actualizarEstadosVisuales();
  renderPropiedades();
}

function eliminarBloqueSeleccionado() {
  if (state.selectedId == null) return;
  guardarSnapshot();
  const aEliminar = new Set([state.selectedId]);
  let cambio = true;
  while (cambio) {
    cambio = false;
    state.blocks.forEach((b) => {
      if (b.parent_id != null && aEliminar.has(b.parent_id) && !aEliminar.has(b.id)) {
        aEliminar.add(b.id);
        cambio = true;
      }
    });
  }
  const remotosAEliminar = state.blocks
    .filter((b) => aEliminar.has(b.id) && b.remoteId != null)
    .map((b) => b.remoteId);

  state.blocks = state.blocks.filter((b) => !aEliminar.has(b.id));
  state.selectedId = null;
  renderCanvas();
  renderPropiedades();

  remotosAEliminar.forEach((remoteId) => {
    api.eliminarBloque(remoteId).catch((e) => console.error('No se pudo eliminar en Neon', remoteId, e));
  });
}

function actualizarCampo(id, path, valor) {
  const bloque = state.blocks.find((b) => b.id === id);
  if (!bloque) return;

  registrarEdicionDebounced();
  escribirCampo(bloque, path, valor);
  renderCanvas();
  programarGuardado();
}

// --- Edición directa en el lienzo (doble clic, como en un editor de texto) ---
// Mismo historial y autoguardado que el panel de propiedades, pero sin
// renderCanvas() en cada tecleo: reemplazaría el nodo contenteditable
// bajo el cursor y perdería el foco/la posición del cursor a media edición.

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

// --- Eventos ---

document.querySelector('.ed-widget-grid').addEventListener('click', (e) => {
  const card = e.target.closest('.ed-widget-card');
  if (!card) return;
  crearBloque(card.dataset.tipo);
});

const canvasWrap = document.querySelector('.ed-canvas-wrap');

canvasWrap.addEventListener('click', (e) => {
  // Mientras se edita directamente un texto, un clic ahí es solo para
  // mover el cursor — no debe volver a seleccionar/re-renderizar el bloque.
  if (state.editandoInline && state.editandoInline.el.contains(e.target)) return;

  const bloqueEl = e.target.closest('[data-block-id]');
  if (bloqueEl) {
    e.stopPropagation();
    seleccionarBloque(Number(bloqueEl.dataset.blockId));
    return;
  }

  const zonaEl = e.target.closest('.ed-zone');
  if (zonaEl) {
    activarZona(zonaEl.dataset.zona);
    return;
  }

  deseleccionar();
});

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

const propertiesBody = document.getElementById('propertiesBody');

// Solo "input": dispara con cada tecleo y con cada cambio de <select> en
// todos los navegadores modernos. "change" se dispara también al perder
// foco si el valor cambió, duplicando la escritura y ensuciando el
// historial de deshacer con un snapshot fantasma idéntico al actual.
propertiesBody.addEventListener('input', (e) => {
  const campo = e.target.dataset.campo;
  if (!campo || state.selectedId == null) return;
  actualizarCampo(state.selectedId, campo, e.target.value);
});

propertiesBody.addEventListener('click', (e) => {
  if (e.target.closest('[data-accion="eliminar"]')) eliminarBloqueSeleccionado();
});

document.getElementById('btnDeshacer').addEventListener('click', deshacer);
document.getElementById('btnRehacer').addEventListener('click', rehacer);

document.addEventListener('keydown', (e) => {
  const enCampoDeTexto = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
  if (enCampoDeTexto) return;
  if (e.key.toLowerCase() !== 'z' || !(e.ctrlKey || e.metaKey)) return;

  e.preventDefault();
  if (e.shiftKey) rehacer(); else deshacer();
});

async function inicializar() {
  const params = new URLSearchParams(window.location.search);
  const idSitio = params.get('site');

  if (!idSitio) {
    window.location.href = '/dashboard.html';
    return;
  }

  state.siteId = idSitio;

  try {
    const resp = await api.listarSitios();
    const sitio = (resp.sitios || []).find((s) => String(s.id) === String(state.siteId));
    if (sitio) document.getElementById('siteName').textContent = sitio.nombre;
  } catch (e) {
    console.error('No se pudo obtener el nombre del sitio', e);
  }

  try {
    const resp = await api.listarBloques(state.siteId);
    state.blocks = (resp.bloques || []).map((b) => ({
      id: state.nextId++,
      remoteId: b.id,
      tipo: b.tipo,
      contenido: b.contenido,
      estilos: b.estilos,
      zona: b.zona,
      parent_id: null,
      orden: b.orden,
      _parentRemoteId: b.parent_id,
    }));
    state.blocks.forEach((b) => {
      if (b._parentRemoteId != null) {
        const padre = state.blocks.find((x) => x.remoteId === b._parentRemoteId);
        b.parent_id = padre ? padre.id : null;
      }
      delete b._parentRemoteId;
    });
    marcarEstado('');
  } catch (e) {
    console.error('No se pudieron cargar los bloques', e);
    marcarEstado('Sin conexión — trabajando solo en este navegador');
  }

  renderCanvas();
  renderPropiedades();
}

inicializar();
