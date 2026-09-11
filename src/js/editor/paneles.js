/*
  paneles.js
  El "chrome" del panel lateral y la barra superior: qué panel se
  muestra (Bloques/Capas/Plantillas/Páginas/Ajustes/Tienda), la lista
  fija de Plantillas, el árbol de Capas, y la vista de dispositivo del
  topbar. Cada acción real (crear/seleccionar bloque) vive en bloques.js.
*/

import { PLANTILLAS, CATALOGO_BLOQUES } from './state.js';
import { crearBloque, insertarPlantilla, seleccionarBloque } from './bloques.js';

const TITULOS_PANEL = { bloques: 'Bloques', capas: 'Capas', plantillas: 'Plantillas', paginas: 'Páginas', ajustes: 'Ajustes', tienda: 'Tienda' };

function mostrarPanel(nombre) {
  document.querySelectorAll('.ed-rail-item[data-panel]').forEach((el) => {
    el.querySelector('.icon-frame').classList.toggle('is-active', el.dataset.panel === nombre);
  });
  document.querySelectorAll('.ed-panel-content').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.panelContent === nombre);
  });
  document.getElementById('panelTitle').textContent = TITULOS_PANEL[nombre] || '';
}

function initVistaDispositivo() {
  // Solo el ancho del lienzo, para previsualizar mientras se edita — no
  // toca `state`.
  document.querySelectorAll('.ed-topbar-center [data-vista]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ed-topbar-center .icon-frame').forEach((el) => el.classList.remove('is-active'));
      btn.querySelector('.icon-frame').classList.add('is-active');

      const pagina = document.querySelector('.ed-page');
      pagina.classList.remove('ed-page--tablet', 'ed-page--movil');
      if (btn.dataset.vista === 'tablet') pagina.classList.add('ed-page--tablet');
      if (btn.dataset.vista === 'movil') pagina.classList.add('ed-page--movil');
    });
  });
}

export function initPaneles() {
  const widgetGrid = document.querySelector('.ed-widget-grid');
  widgetGrid.innerHTML = CATALOGO_BLOQUES.map((b) => `
    <div class="ed-widget-card" data-tipo="${b.tipo}">
      <div class="icon-frame icon-frame--22">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${b.icono}</svg>
      </div>
      <span class="ed-widget-label">${b.etiqueta}</span>
    </div>`).join('');

  widgetGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.ed-widget-card');
    if (!card) return;
    crearBloque(card.dataset.tipo);
  });

  document.querySelectorAll('.ed-rail-item[data-panel]').forEach((el) => {
    el.addEventListener('click', () => mostrarPanel(el.dataset.panel));
  });
  mostrarPanel('bloques');

  document.getElementById('layersTree').addEventListener('click', (e) => {
    const fila = e.target.closest('[data-block-id]');
    if (fila) seleccionarBloque(Number(fila.dataset.blockId));
  });

  document.getElementById('tplItemList').innerHTML = PLANTILLAS.map((p) => `
    <button type="button" class="ed-tpl-item" data-plantilla="${p.id}">
      <span class="ed-tpl-item-nombre">${p.nombre}</span>
    </button>`).join('');

  document.getElementById('tplItemList').addEventListener('click', (e) => {
    const item = e.target.closest('[data-plantilla]');
    if (item) insertarPlantilla(item.dataset.plantilla);
  });

  initVistaDispositivo();
}
