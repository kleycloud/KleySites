/*
  canvas.js
  Punto de entrada del editor: sesión, arranque (inicializar) y el
  cableado de eventos que le pertenece al lienzo/propiedades en sí (el
  resto de los paneles se inicializan cada uno desde su propio módulo).
*/

import * as api from '../api.js';
import { initAccountMenu } from '../account-menu.js';
import { state } from './state.js';
import { marcarEstado } from './sync.js';
import { renderCanvas, renderPropiedades } from './render.js';
import { deshacer, rehacer, seleccionarBloque, activarZona, deseleccionar } from './bloques.js';
import { initEdicionInline, estaEditandoInline } from './edicion-inline.js';
import { initArrastre } from './arrastrar.js';
import { initPaneles } from './paneles.js';
import { initPropiedades } from './propiedades/eventos.js';
import { initPaginas, cargarPaginasIniciales } from './paginas.js';
import { initAjustes, setSitioActual } from './ajustes.js';
import { initImportarUI } from './importar-ui.js';
import { initPublicar } from './publicar.js';
import { initExportar } from './exportar.js';
import { initVistaPrevia } from './vista-previa.js';

// Sin sesión, no hay editor: se necesita el token para leer/guardar en Neon.
if (!localStorage.getItem('kleysites_token')) {
  window.location.href = '/';
}

initAccountMenu(document.getElementById('btnCuentaEditor'), document.getElementById('menuCuentaEditor'));
document.getElementById('btnVolverDashboard').addEventListener('click', () => {
  window.location.href = '/dashboard.html';
});

initPaneles();
initPropiedades(document.getElementById('propertiesBody'));
initPaginas();
initAjustes();
initImportarUI();
initPublicar();
initExportar();
initVistaPrevia();

const canvasWrap = document.querySelector('.ed-canvas-wrap');
initEdicionInline(canvasWrap);
initArrastre(canvasWrap);

canvasWrap.addEventListener('click', (e) => {
  // Mientras se edita directamente un texto, un clic ahí es solo para
  // mover el cursor — no debe volver a seleccionar/re-renderizar el bloque.
  if (estaEditandoInline(e.target)) return;

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
    if (sitio) {
      document.getElementById('siteName').textContent = sitio.nombre;
      setSitioActual(sitio);
    }
  } catch (e) {
    console.error('No se pudo obtener el nombre del sitio', e);
  }

  const huboPagina = await cargarPaginasIniciales(state.siteId);
  if (!huboPagina) marcarEstado('Sin conexión — trabajando solo en este navegador');
}

inicializar();
