/*
  paneles.js
  El "chrome" del panel lateral y la barra superior: qué panel se
  muestra (Bloques/Capas/Plantillas/Páginas/Ajustes/Tienda), la lista
  fija de Plantillas, el árbol de Capas, y la vista de dispositivo del
  topbar. Cada acción real (crear/seleccionar bloque) vive en bloques.js.
*/

import { PLANTILLAS, CATALOGO_BLOQUES, CATEGORIAS, BLOQUES_PROXIMAMENTE } from './state.js';
import { crearBloque, insertarPlantilla, seleccionarBloque } from './bloques.js';

// Para que "titulo" encuentre "Título": sin acentos y en minúsculas.
const normalizar = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function tarjetaHTML(b, proximamente) {
  const extra = proximamente ? ' data-proximamente="1" aria-disabled="true" title="Todavía no existe"' : '';
  return `
    <div class="ed-widget-card" data-tipo="${b.tipo}" data-nombre="${normalizar(b.etiqueta)}"${extra}>
      <div class="icon-frame icon-frame--20">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${b.icono}</svg>
      </div>
      <span class="ed-widget-label">${b.etiqueta}</span>
      ${proximamente ? '<span class="ed-widget-soon">Próximamente</span>' : ''}
    </div>`;
}

// Una categoría colapsable por CATEGORIAS; los "Próximamente" van al final
// de la suya, deshabilitados. Una categoría sin nada no se pinta.
function renderCatalogo() {
  const cont = document.getElementById('widgetCatalogo');
  cont.innerHTML = CATEGORIAS.map((cat) => {
    const tarjetas = [
      ...CATALOGO_BLOQUES.filter((b) => b.categoria === cat.id).map((b) => tarjetaHTML(b, false)),
      ...BLOQUES_PROXIMAMENTE.filter((b) => b.categoria === cat.id).map((b) => tarjetaHTML(b, true)),
    ];
    if (!tarjetas.length) return '';
    return `
      <details class="ed-widget-categoria" data-categoria="${cat.id}" open>
        <summary>${cat.nombre}</summary>
        <div class="ed-widget-grid">${tarjetas.join('')}</div>
      </details>`;
  }).join('');
}

function initBuscadorBloques() {
  const input = document.getElementById('inputBuscarBloques');
  const cont = document.getElementById('widgetCatalogo');
  input.addEventListener('input', () => {
    const q = normalizar(input.value.trim());
    cont.querySelectorAll('.ed-widget-card').forEach((card) => {
      card.hidden = q.length > 0 && !card.dataset.nombre.includes(q);
    });
    cont.querySelectorAll('.ed-widget-categoria').forEach((cat) => {
      const hayVisibles = [...cat.querySelectorAll('.ed-widget-card')].some((c) => !c.hidden);
      cat.hidden = !hayVisibles;
      if (q) cat.open = true; // buscando, nada queda escondido en una categoría cerrada
    });
  });
}

const TITULOS_PANEL = { bloques: 'Bloques', capas: 'Capas', plantillas: 'Plantillas', paginas: 'Páginas', ajustes: 'Ajustes', tienda: 'Tienda' };

function mostrarPanel(nombre) {
  document.querySelectorAll('.ed-rail-item[data-panel]').forEach((el) => {
    const activo = el.dataset.panel === nombre;
    el.querySelector('.icon-frame').classList.toggle('is-active', activo);
    el.classList.toggle('is-active', activo);
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
  renderCatalogo();
  initBuscadorBloques();

  document.getElementById('widgetCatalogo').addEventListener('click', (e) => {
    const card = e.target.closest('.ed-widget-card');
    if (!card || card.dataset.proximamente) return;
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
