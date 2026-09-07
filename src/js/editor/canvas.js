import * as api from '../api.js';
import { initAccountMenu } from '../account-menu.js';

// Sin sesión, no hay editor: se necesita el token para leer/guardar en Neon.
if (!localStorage.getItem('kleysites_token')) {
  window.location.href = '/';
}

initAccountMenu(document.getElementById('btnCuentaEditor'), document.getElementById('menuCuentaEditor'));
document.getElementById('btnVolverDashboard').addEventListener('click', () => {
  window.location.href = '/dashboard.html';
});

// Estado del lienzo en memoria, sincronizado con Neon.
// `id` es el identificador local (estable durante toda la sesión, para
// anidar y seleccionar); `remoteId` es el id real en la tabla `blocks`
// una vez que ese bloque ya se guardó al menos una vez.
let nextId = 1;
let blocks = [];
let selectedId = null;
let zonaActiva = 'contenido'; // dónde cae lo próximo que se inserte desde el panel
let siteId = null;
let editandoInline = null; // { id, path, el } — bloque en edición directa (doble clic) en el lienzo

const ZONAS = ['encabezado', 'contenido', 'pie'];

const ETIQUETAS = {
  texto: 'Texto', titulo: 'Título', imagen: 'Imagen',
  boton: 'Botón', video: 'Video', seccion: 'Sección', columnas: 'Columnas',
};

const CONTENEDORES = new Set(['seccion', 'columnas']);

const CONTENIDO_INICIAL = {
  texto: { html: 'Escribe aquí tu texto' },
  titulo: { texto: 'Título', nivel: 'h2' },
  imagen: { src: '', alt: '' },
  boton: { texto: 'Botón', href: '#' },
  video: { src: '' },
  seccion: {},
  columnas: {},
};

const CAMPOS = {
  texto: [{ key: 'contenido.html', label: 'Texto', type: 'textarea' }],
  titulo: [
    { key: 'contenido.texto', label: 'Texto', type: 'text' },
    { key: 'contenido.nivel', label: 'Nivel', type: 'select', opciones: ['h1', 'h2', 'h3', 'h4'] },
  ],
  imagen: [
    { key: 'contenido.src', label: 'Imagen (URL)', type: 'text' },
    { key: 'contenido.alt', label: 'Texto alternativo', type: 'text' },
  ],
  boton: [
    { key: 'contenido.texto', label: 'Texto del botón', type: 'text' },
    { key: 'contenido.href', label: 'Enlace', type: 'text' },
  ],
  video: [{ key: 'contenido.src', label: 'Video (URL)', type: 'text' }],
  seccion: [],
  columnas: [],
};

function leerCampo(bloque, path) {
  const [grupo, clave] = path.split('.');
  return (bloque[grupo] && bloque[grupo][clave]) || '';
}

function escribirCampo(bloque, path, valor) {
  const [grupo, clave] = path.split('.');
  bloque[grupo][clave] = valor;
}

// --- Historial (deshacer / rehacer) ---
// Snapshots del estado completo: la escala de datos es pequeña y así
// no hay que razonar qué revertir en cada tipo de mutación.

let historial = [];
let historialFuturo = [];
let edicionEnCurso = null; // temporizador del debounce de edición de campos

function guardarSnapshot() {
  historial.push(JSON.stringify(blocks));
  if (historial.length > 100) historial.shift();
  historialFuturo = [];
  actualizarBotonesHistorial();
}

function remoteIdsPresentes(lista) {
  return new Set(lista.filter((b) => b.remoteId != null).map((b) => b.remoteId));
}

// Si deshacer/rehacer hace desaparecer un bloque que ya se había guardado
// en Neon (autoguardado corrió antes de que el usuario presionara
// deshacer), ese bloque quedaría huérfano en la base — se borra en Neon
// también, igual que el botón "Eliminar bloque".
function limpiarHuerfanos(antes, despues) {
  antes.forEach((remoteId) => {
    if (!despues.has(remoteId)) {
      api.eliminarBloque(remoteId).catch((e) => console.error('No se pudo limpiar huérfano', remoteId, e));
    }
  });
}

function deshacer() {
  if (historial.length === 0) return;
  const antes = remoteIdsPresentes(blocks);
  historialFuturo.push(JSON.stringify(blocks));
  blocks = JSON.parse(historial.pop());
  selectedId = null;
  renderCanvas();
  renderPropiedades();
  actualizarBotonesHistorial();
  limpiarHuerfanos(antes, remoteIdsPresentes(blocks));
  programarGuardado();
}

function rehacer() {
  if (historialFuturo.length === 0) return;
  const antes = remoteIdsPresentes(blocks);
  historial.push(JSON.stringify(blocks));
  blocks = JSON.parse(historialFuturo.pop());
  selectedId = null;
  renderCanvas();
  renderPropiedades();
  actualizarBotonesHistorial();
  limpiarHuerfanos(antes, remoteIdsPresentes(blocks));
  programarGuardado();
}

function actualizarBotonesHistorial() {
  const btnDeshacer = document.getElementById('btnDeshacer');
  const btnRehacer = document.getElementById('btnRehacer');
  if (btnDeshacer) btnDeshacer.disabled = historial.length === 0;
  if (btnRehacer) btnRehacer.disabled = historialFuturo.length === 0;
}

// --- Autoguardado en Neon ---

let statusTimer = null;

function marcarEstado(texto, persistente = false) {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  el.textContent = texto;
  clearTimeout(statusTimer);
  if (!persistente) statusTimer = setTimeout(() => { el.textContent = ''; }, 2000);
}

async function sincronizar() {
  if (!siteId) return;
  marcarEstado('Guardando…', true);

  let progreso = true;
  const yaGuardados = new Set();
  let huboError = false;

  while (progreso) {
    progreso = false;
    for (const b of blocks) {
      if (yaGuardados.has(b.id)) continue;
      const padre = b.parent_id == null ? null : blocks.find((x) => x.id === b.parent_id);
      const padreListo = b.parent_id == null || (padre && padre.remoteId != null);
      if (!padreListo) continue;

      try {
        const resp = await api.guardarBloque({
          block_id: b.remoteId ?? null,
          site_id: siteId,
          tipo: b.tipo,
          contenido: b.contenido,
          orden: b.orden,
          zona: b.zona,
          parent_id: padre ? padre.remoteId : null,
          estilos: b.estilos,
        });
        b.remoteId = resp.bloque.id;
      } catch (e) {
        console.error('No se pudo guardar el bloque', b.id, e);
        huboError = true;
      }
      yaGuardados.add(b.id);
      progreso = true;
    }
  }

  marcarEstado(huboError ? 'No se pudo guardar' : 'Guardado');
}

let guardadoTimer = null;
function programarGuardado() {
  clearTimeout(guardadoTimer);
  guardadoTimer = setTimeout(sincronizar, 800);
}

function crearBloque(tipo) {
  guardarSnapshot();

  const seleccionado = blocks.find((b) => b.id === selectedId);
  const enContenedor = seleccionado && CONTENEDORES.has(seleccionado.tipo) && seleccionado.zona === zonaActiva;
  const parentId = enContenedor ? seleccionado.id : null;
  const zona = zonaActiva;
  const hermanos = blocks.filter((b) => b.parent_id === parentId && b.zona === zona);

  blocks.push({
    id: nextId++,
    remoteId: null,
    tipo,
    contenido: structuredClone(CONTENIDO_INICIAL[tipo] || {}),
    estilos: {},
    zona,
    parent_id: parentId,
    orden: hermanos.length,
  });
  selectedId = blocks[blocks.length - 1].id;
  renderCanvas();
  renderPropiedades();
  programarGuardado();
}

// Solo actualiza clases (selección, zona activa) sin tocar el innerHTML de
// los bloques: reemplazar el nodo bajo el cursor entre el primer y segundo
// clic de un doble clic le impide a Chromium reconocerlo como "dblclick"
// (cuenta el clic de nuevo desde cero si el elemento cambió de identidad).
function actualizarEstadosVisuales() {
  document.querySelectorAll('.ed-block').forEach((el) => {
    el.classList.toggle('is-selected', Number(el.dataset.blockId) === selectedId);
  });
  document.querySelectorAll('.ed-zone').forEach((el) => {
    el.classList.toggle('is-target', el.dataset.zona === zonaActiva);
  });
}

function seleccionarBloque(id) {
  const bloque = blocks.find((b) => b.id === id);
  if (bloque) zonaActiva = bloque.zona;
  selectedId = id;
  actualizarEstadosVisuales();
  renderPropiedades();
}

function activarZona(zona) {
  zonaActiva = zona;
  selectedId = null;
  actualizarEstadosVisuales();
  renderPropiedades();
}

function deseleccionar() {
  selectedId = null;
  actualizarEstadosVisuales();
  renderPropiedades();
}

function eliminarBloqueSeleccionado() {
  if (selectedId == null) return;
  guardarSnapshot();
  const aEliminar = new Set([selectedId]);
  let cambio = true;
  while (cambio) {
    cambio = false;
    blocks.forEach((b) => {
      if (b.parent_id != null && aEliminar.has(b.parent_id) && !aEliminar.has(b.id)) {
        aEliminar.add(b.id);
        cambio = true;
      }
    });
  }
  const remotosAEliminar = blocks
    .filter((b) => aEliminar.has(b.id) && b.remoteId != null)
    .map((b) => b.remoteId);

  blocks = blocks.filter((b) => !aEliminar.has(b.id));
  selectedId = null;
  renderCanvas();
  renderPropiedades();

  remotosAEliminar.forEach((remoteId) => {
    api.eliminarBloque(remoteId).catch((e) => console.error('No se pudo eliminar en Neon', remoteId, e));
  });
}

function actualizarCampo(id, path, valor) {
  const bloque = blocks.find((b) => b.id === id);
  if (!bloque) return;

  if (!edicionEnCurso) guardarSnapshot();
  clearTimeout(edicionEnCurso);
  edicionEnCurso = setTimeout(() => { edicionEnCurso = null; }, 600);

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
  const bloque = blocks.find((b) => b.id === id);
  if (!bloque) return;
  if (!edicionEnCurso) guardarSnapshot();
  clearTimeout(edicionEnCurso);
  edicionEnCurso = setTimeout(() => { edicionEnCurso = null; }, 600);
  escribirCampo(bloque, path, valor);
  programarGuardado();
}

function iniciarEdicionInline(elInicial) {
  const blockEl = elInicial.closest('[data-block-id]');
  if (!blockEl) return;
  const id = Number(blockEl.dataset.blockId);
  const path = elInicial.dataset.editableField;

  seleccionarBloque(id); // re-renderiza; el nodo original queda obsoleto

  const elFresco = document.querySelector(`[data-block-id="${id}"][data-editable-field="${path}"]`)
    || document.querySelector(`[data-block-id="${id}"] [data-editable-field="${path}"]`);
  if (!elFresco) return;

  editandoInline = { id, path, el: elFresco };
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
  if (!editandoInline) return;
  const { el } = editandoInline;
  el.removeAttribute('contenteditable');
  el.classList.remove('is-editing');
  editandoInline = null;
  renderCanvas();
  renderPropiedades();
}

// --- Render del lienzo ---

const MAPA_ESTILOS = { color: 'color', fondo: 'background' };

function estiloInline(estilos) {
  return Object.entries(estilos || {})
    .filter(([k, v]) => MAPA_ESTILOS[k] && v)
    .map(([k, v]) => `${MAPA_ESTILOS[k]}:${v}`)
    .join(';');
}

function escapeHTML(str) {
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
  const hijos = blocks
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
  if (b.id === selectedId) clases.push('is-selected');

  return `<div class="${clases.join(' ')}" data-block-id="${b.id}">${interior}</div>`;
}

function renderZonaBloques(zona) {
  const mount = document.querySelector(`[data-zone-blocks="${zona}"]`);
  if (!mount) return;

  const raices = blocks
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

function renderCanvas() {
  ZONAS.forEach(renderZonaBloques);
  actualizarEstadosVisuales();
}

// --- Render del panel de propiedades ---

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

function renderPropiedades() {
  const cont = document.getElementById('propertiesBody');
  if (!cont) return;

  const bloque = blocks.find((b) => b.id === selectedId);
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
  if (editandoInline && editandoInline.el.contains(e.target)) return;

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
  if (!editandoInline || e.target !== editandoInline.el) return;
  const { id, path } = editandoInline;
  const valor = CAMPOS_TEXTO_PLANO.has(path) ? e.target.textContent : e.target.innerHTML;
  escribirCampoSinRender(id, path, valor);
});

canvasWrap.addEventListener('keydown', (e) => {
  if (!editandoInline || e.target !== editandoInline.el) return;
  if (e.key === 'Escape') { e.preventDefault(); e.target.blur(); return; }
  if (e.key === 'Enter' && CAMPOS_TEXTO_PLANO.has(editandoInline.path)) {
    e.preventDefault();
    e.target.blur();
  }
});

canvasWrap.addEventListener('paste', (e) => {
  if (!editandoInline || e.target !== editandoInline.el) return;
  if (!CAMPOS_TEXTO_PLANO.has(editandoInline.path)) return;
  e.preventDefault();
  const texto = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, texto);
});

canvasWrap.addEventListener('blur', (e) => {
  if (editandoInline && e.target === editandoInline.el) finalizarEdicionInline();
}, true);

const propertiesBody = document.getElementById('propertiesBody');

// Solo "input": dispara con cada tecleo y con cada cambio de <select> en
// todos los navegadores modernos. "change" se dispara también al perder
// foco si el valor cambió, duplicando la escritura y ensuciando el
// historial de deshacer con un snapshot fantasma idéntico al actual.
propertiesBody.addEventListener('input', (e) => {
  const campo = e.target.dataset.campo;
  if (!campo || selectedId == null) return;
  actualizarCampo(selectedId, campo, e.target.value);
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

  siteId = idSitio;

  try {
    const resp = await api.listarSitios();
    const sitio = (resp.sitios || []).find((s) => String(s.id) === String(siteId));
    if (sitio) document.getElementById('siteName').textContent = sitio.nombre;
  } catch (e) {
    console.error('No se pudo obtener el nombre del sitio', e);
  }

  if (siteId) {
    try {
      const resp = await api.listarBloques(siteId);
      blocks = (resp.bloques || []).map((b) => ({
        id: nextId++,
        remoteId: b.id,
        tipo: b.tipo,
        contenido: b.contenido,
        estilos: b.estilos,
        zona: b.zona,
        parent_id: null,
        orden: b.orden,
        _parentRemoteId: b.parent_id,
      }));
      blocks.forEach((b) => {
        if (b._parentRemoteId != null) {
          const padre = blocks.find((x) => x.remoteId === b._parentRemoteId);
          b.parent_id = padre ? padre.id : null;
        }
        delete b._parentRemoteId;
      });
      marcarEstado('');
    } catch (e) {
      console.error('No se pudieron cargar los bloques', e);
      marcarEstado('Sin conexión — trabajando solo en este navegador');
    }
  }

  renderCanvas();
  renderPropiedades();
  actualizarBotonesHistorial();
}

inicializar();
