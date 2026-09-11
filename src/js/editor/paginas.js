/*
  paginas.js
  Panel "Páginas": listar las páginas del sitio, cambiar de página
  (recarga los bloques) y crear una nueva.
*/

import * as api from '../api.js';
import { state } from './state.js';
import { marcarEstado } from './sync.js';
import { renderCanvas, renderPropiedades } from './render.js';
import { mostrarAviso } from '../aviso.js';

let paginasSitio = [];

export function getPaginasSitio() {
  return paginasSitio;
}

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
    // incondicional le pisaría el DOM a media edición.
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
    await mostrarAviso(e.message || 'No se pudo crear la página. Intenta de nuevo.');
  }
}

// Devuelve la página con ese nombre, creándola si no existe (importación
// de proyectos con varias páginas).
export async function asegurarPagina(nombre) {
  const existente = paginasSitio.find((p) => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (existente) return existente;
  const resp = await api.crearPagina(state.siteId, nombre);
  paginasSitio.push(resp.pagina);
  renderPaginaList();
  return resp.pagina;
}

export function initPaginas() {
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
}

// Carga inicial (desde inicializar en canvas.js): trae las páginas del
// sitio, autocrea "Inicio" si no hay ninguna, y carga los bloques de la
// primera. Devuelve true si logró dejar una página activa.
export async function cargarPaginasIniciales(siteId) {
  try {
    const resp = await api.listarPaginas(siteId);
    paginasSitio = resp.paginas || [];
  } catch (e) {
    console.error('No se pudieron cargar las páginas', e);
    paginasSitio = [];
  }
  if (paginasSitio.length === 0) {
    try {
      const creada = await api.crearPagina(siteId, 'Inicio');
      paginasSitio = [creada.pagina];
    } catch (e) {
      console.error('No se pudo crear la página inicial', e);
    }
  }
  renderPaginaList();

  if (paginasSitio.length === 0) return false;
  state.pageId = paginasSitio[0].id;
  await cargarBloquesDePagina(state.pageId);
  return true;
}
