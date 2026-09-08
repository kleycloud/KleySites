/*
  canvas.js
  Controlador del editor: conecta el estado (state.js), el historial
  (history.js), el autoguardado (sync.js) y el render (render.js) con los
  eventos del DOM. No contiene reglas de negocio propias más allá de esa
  orquestación.
*/

import * as api from '../api.js';
import { initAccountMenu } from '../account-menu.js';
import { state, CONTENEDORES, CONTENIDO_INICIAL, PLANTILLAS, ETIQUETAS_ZONA, escribirCampo } from './state.js';
import { guardarSnapshot, registrarEdicionDebounced, deshacer as deshacerHistorial, rehacer as rehacerHistorial } from './history.js';
import { marcarEstado, programarGuardado } from './sync.js';
import { renderCanvas, renderPropiedades, actualizarEstadosVisuales } from './render.js';
import { contenedorDestino, datosDestino, indiceDeInsercion } from './dragdrop.js';
import { analizarHTML } from './importar.js';

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

// Inserta un árbol de bloques ({ tipo, contenido, hijos? }) ya armado —
// lo comparten las plantillas (contenido fijo del código) y la
// importación de HTML (contenido ajeno, ya saneado en importar.js).
function insertarArbol(nodos, zona, parentId, ordenInicial = 0) {
  nodos.forEach((n, i) => {
    const bloque = {
      id: state.nextId++,
      remoteId: null,
      tipo: n.tipo,
      contenido: structuredClone(n.contenido),
      estilos: {},
      zona,
      parent_id: parentId,
      orden: ordenInicial + i,
    };
    state.blocks.push(bloque);
    if (n.hijos && n.hijos.length) insertarArbol(n.hijos, zona, bloque.id);
  });
}

function insertarPlantilla(id) {
  const plantilla = PLANTILLAS.find((p) => p.id === id);
  if (!plantilla) return;

  guardarSnapshot();
  const zona = state.zonaActiva;
  const hermanos = state.blocks.filter((b) => b.parent_id === null && b.zona === zona);
  const seccion = {
    id: state.nextId++, remoteId: null, tipo: 'seccion', contenido: {}, estilos: {},
    zona, parent_id: null, orden: hermanos.length,
  };
  state.blocks.push(seccion);
  insertarArbol(plantilla.hijos, zona, seccion.id);

  state.selectedId = seccion.id;
  renderCanvas();
  renderPropiedades();
  programarGuardado();
}

function importarHTML(html) {
  const arbol = analizarHTML(html);
  if (!arbol.length) return false;

  guardarSnapshot();
  const zona = state.zonaActiva;
  const base = state.blocks.filter((b) => b.parent_id === null && b.zona === zona).length;
  insertarArbol(arbol, zona, null, base);

  renderCanvas();
  renderPropiedades();
  programarGuardado();
  return true;
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

// --- Arrastrar y soltar para reordenar/reanidar bloques ---

// true si moverlo a nuevoParentId lo metería dentro de sí mismo o de uno
// de sus propios descendientes (una sección arrastrada sobre su propio hijo).
function formaCiclo(idArrastrado, nuevoParentId) {
  if (nuevoParentId == null) return false;
  let actual = state.blocks.find((b) => b.id === nuevoParentId);
  while (actual) {
    if (actual.id === idArrastrado) return true;
    actual = actual.parent_id == null ? null : state.blocks.find((b) => b.id === actual.parent_id);
  }
  return false;
}

function moverBloque(idArrastrado, zonaDestino, parentIdDestino, indiceDestino) {
  const bloque = state.blocks.find((b) => b.id === idArrastrado);
  if (!bloque || zonaDestino == null) return;
  if (idArrastrado === parentIdDestino || formaCiclo(idArrastrado, parentIdDestino)) return;
  if (bloque.zona === zonaDestino && bloque.parent_id === parentIdDestino) {
    // Reordenar dentro del mismo grupo: si ya está justo en ese índice, no
    // hay nada que hacer (evita un snapshot de deshacer vacío).
    const hermanos = state.blocks
      .filter((b) => b.zona === zonaDestino && b.parent_id === parentIdDestino)
      .sort((a, z) => a.orden - z.orden);
    if (hermanos[indiceDestino] === bloque) return;
  }

  guardarSnapshot();

  const hermanosViejos = state.blocks
    .filter((b) => b.id !== idArrastrado && b.zona === bloque.zona && b.parent_id === bloque.parent_id)
    .sort((a, z) => a.orden - z.orden);
  hermanosViejos.forEach((b, i) => { b.orden = i; });

  bloque.zona = zonaDestino;
  bloque.parent_id = parentIdDestino;

  const hermanosNuevos = state.blocks
    .filter((b) => b.id !== idArrastrado && b.zona === zonaDestino && b.parent_id === parentIdDestino)
    .sort((a, z) => a.orden - z.orden);
  hermanosNuevos.splice(Math.min(indiceDestino, hermanosNuevos.length), 0, bloque);
  hermanosNuevos.forEach((b, i) => { b.orden = i; });

  renderCanvas();
  renderPropiedades();
  programarGuardado();
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

// --- Riel lateral: qué panel se muestra (Bloques/Capas/Plantillas/...) ---

const TITULOS_PANEL = { bloques: 'Bloques', capas: 'Capas', plantillas: 'Plantillas', paginas: 'Páginas', tienda: 'Tienda' };

function mostrarPanel(nombre) {
  document.querySelectorAll('.ed-rail-item[data-panel]').forEach((el) => {
    el.querySelector('.icon-frame').classList.toggle('is-active', el.dataset.panel === nombre);
  });
  document.querySelectorAll('.ed-panel-content').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.panelContent === nombre);
  });
  document.getElementById('panelTitle').textContent = TITULOS_PANEL[nombre] || '';
}

document.querySelectorAll('.ed-rail-item[data-panel]').forEach((el) => {
  el.addEventListener('click', () => mostrarPanel(el.dataset.panel));
});
mostrarPanel('bloques');

// --- Capas: clic en una fila selecciona ese bloque ---

document.getElementById('layersTree').addEventListener('click', (e) => {
  const fila = e.target.closest('[data-block-id]');
  if (fila) seleccionarBloque(Number(fila.dataset.blockId));
});

// --- Plantillas: lista fija, se pinta una sola vez ---

document.getElementById('tplItemList').innerHTML = PLANTILLAS.map((p) => `
  <button type="button" class="ed-tpl-item" data-plantilla="${p.id}">
    <span class="ed-tpl-item-nombre">${p.nombre}</span>
  </button>`).join('');

document.getElementById('tplItemList').addEventListener('click', (e) => {
  const item = e.target.closest('[data-plantilla]');
  if (item) insertarPlantilla(item.dataset.plantilla);
});

// --- Páginas: lista dinámica (se pinta desde inicializar/cambiarPagina) ---

document.getElementById('paginaList').addEventListener('click', (e) => {
  const item = e.target.closest('[data-pagina-id]');
  if (item) cambiarPagina(Number(item.dataset.paginaId));
});

document.getElementById('formCrearPagina').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('inputNombrePagina');
  crearPaginaNueva(input.value);
  input.value = '';
});

// --- Importar HTML ---

const modalImportar = document.getElementById('modalImportar');
const textareaImportar = document.getElementById('textareaImportar');
const modalImportarError = document.getElementById('modalImportarError');

function abrirModalImportar() {
  document.getElementById('modalZonaNombre').textContent = ETIQUETAS_ZONA[state.zonaActiva] || state.zonaActiva;
  textareaImportar.value = '';
  modalImportarError.hidden = true;
  modalImportar.classList.add('is-open');
  textareaImportar.focus();
}

function cerrarModalImportar() {
  modalImportar.classList.remove('is-open');
}

document.getElementById('btnImportar').addEventListener('click', abrirModalImportar);
document.getElementById('btnCerrarImportar').addEventListener('click', cerrarModalImportar);
document.getElementById('btnCancelarImportar').addEventListener('click', cerrarModalImportar);
modalImportar.addEventListener('click', (e) => {
  if (e.target === modalImportar) cerrarModalImportar();
});

const inputArchivoHTML = document.getElementById('inputArchivoHTML');
document.getElementById('btnSubirArchivo').addEventListener('click', () => inputArchivoHTML.click());
inputArchivoHTML.addEventListener('change', async () => {
  const archivo = inputArchivoHTML.files[0];
  if (!archivo) return;
  textareaImportar.value = await archivo.text();
  inputArchivoHTML.value = '';
});

document.getElementById('btnConfirmarImportar').addEventListener('click', () => {
  const html = textareaImportar.value.trim();
  if (!html) {
    modalImportarError.textContent = 'Pega o sube algo de HTML primero.';
    modalImportarError.hidden = false;
    return;
  }
  const huboBloques = importarHTML(html);
  if (!huboBloques) {
    modalImportarError.textContent = 'No se encontró nada que convertir en bloques.';
    modalImportarError.hidden = false;
    return;
  }
  cerrarModalImportar();
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

// Arrastrar y soltar: la manija (.ed-drag-handle) es lo único con
// draggable="true" — el bloque completo no, para no chocar con la
// selección de texto y la edición directa por doble clic.
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
  // Primero quitar el indicador de la vuelta anterior: si sigue en el DOM
  // mientras se miden las posiciones de los bloques, sus 3px de alto
  // corren el layout y desalinean el índice calculado.
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

  // Se pinta de una vez (los espacios vacíos de cada zona), sin esperar a
  // la red: si para cuando la carga de bloques responda el usuario ya
  // empezó a insertar o editar algo, ese renderCanvas() de más pisaría el
  // DOM a media edición — por eso el único que vuelve a renderizar más
  // abajo es el de la carga exitosa, que sí trae datos nuevos que mostrar.
  renderCanvas();
  renderPropiedades();

  try {
    const resp = await api.listarSitios();
    const sitio = (resp.sitios || []).find((s) => String(s.id) === String(state.siteId));
    if (sitio) document.getElementById('siteName').textContent = sitio.nombre;
  } catch (e) {
    console.error('No se pudo obtener el nombre del sitio', e);
  }

  try {
    const resp = await api.listarPaginas(state.siteId);
    paginasSitio = resp.paginas || [];
  } catch (e) {
    console.error('No se pudieron cargar las páginas', e);
    paginasSitio = [];
  }
  if (paginasSitio.length === 0) {
    // Sitio recién creado (o de antes de que existieran páginas): sin
    // esto no habría dónde guardar los bloques.
    try {
      const creada = await api.crearPagina(state.siteId, 'Inicio');
      paginasSitio = [creada.pagina];
    } catch (e) {
      console.error('No se pudo crear la página inicial', e);
    }
  }
  renderPaginaList();

  if (paginasSitio.length > 0) {
    state.pageId = paginasSitio[0].id;
    await cargarBloquesDePagina(state.pageId);
  } else {
    marcarEstado('Sin conexión — trabajando solo en este navegador');
  }
}

let paginasSitio = [];

function renderPaginaList() {
  const cont = document.getElementById('paginaList');
  if (!cont) return;
  cont.innerHTML = paginasSitio.map((p) => `
    <button type="button" class="ed-pagina-item${p.id === state.pageId ? ' is-active' : ''}" data-pagina-id="${p.id}">
      ${p.nombre}
    </button>`).join('');
}

async function cargarBloquesDePagina(pageId) {
  try {
    const resp = await api.listarBloques(pageId);
    const bloques = (resp.bloques || []).map((b) => ({
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
    bloques.forEach((b) => {
      if (b._parentRemoteId != null) {
        const padre = bloques.find((x) => x.remoteId === b._parentRemoteId);
        b.parent_id = padre ? padre.id : null;
      }
      delete b._parentRemoteId;
    });
    state.blocks = bloques;
    marcarEstado('');
    // Solo se re-renderiza aquí, en el camino exitoso: si la respuesta
    // llega tarde y el usuario ya está editando algo, un renderCanvas()
    // incondicional le pisaría el DOM a media edición (ver el mismo
    // razonamiento en inicializar()).
    renderCanvas();
    renderPropiedades();
  } catch (e) {
    console.error('No se pudieron cargar los bloques', e);
    marcarEstado('Sin conexión — trabajando solo en este navegador');
  }
}

async function cambiarPagina(pageId) {
  if (pageId === state.pageId) return;
  state.pageId = pageId;
  state.selectedId = null;
  state.blocks = [];
  renderPaginaList();
  renderCanvas();
  renderPropiedades();
  marcarEstado('Cargando…', true);
  await cargarBloquesDePagina(pageId);
}

async function crearPaginaNueva(nombre) {
  if (!nombre.trim()) return;
  try {
    const resp = await api.crearPagina(state.siteId, nombre.trim());
    paginasSitio.push(resp.pagina);
    await cambiarPagina(resp.pagina.id);
  } catch (e) {
    console.error('No se pudo crear la página', e);
    alert('No se pudo crear la página. Intenta de nuevo.');
  }
}

inicializar();
