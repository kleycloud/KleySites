import { listarSitios, crearSitio } from './api.js';
import { initAccountMenu, cerrarSesion } from './account-menu.js';
import { mostrarAviso } from './aviso.js';

if (!localStorage.getItem('kleysites_token')) {
  window.location.href = '/';
}

initAccountMenu(document.getElementById('btnCuenta'), document.getElementById('menuCuenta'));

const grid = document.getElementById('sitiosGrid');

function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function tarjetaSitio(sitio) {
  return `
    <a class="db-card" href="/editor.html?site=${sitio.id}">
      <div class="icon-frame icon-frame--24">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
      </div>
      <div class="db-card-nombre">${escapeHTML(sitio.nombre)}</div>
      <div class="db-card-slug">${escapeHTML(sitio.slug)}</div>
    </a>`;
}

function tarjetaCrear() {
  return `
    <div class="db-card db-card--crear" id="tarjetaCrear">
      <div class="icon-frame icon-frame--24">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M4 12h16"/></svg>
      </div>
      <div class="db-card-nombre">Crear sitio nuevo</div>
    </div>`;
}

function estadoVacio() {
  return `
    <div class="db-empty">
      <div class="icon-frame icon-frame--36">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
      </div>
      <p class="db-empty-text">Aún no tienes sitios. Crea el primero para empezar a diseñar.</p>
    </div>`;
}

function pintarSitios(sitios) {
  grid.innerHTML = sitios.map(tarjetaSitio).join('') + tarjetaCrear();
  if (sitios.length === 0) grid.insertAdjacentHTML('afterbegin', estadoVacio());
  const conteo = document.getElementById('conteoSitios');
  if (conteo) conteo.textContent = sitios.length === 0 ? '' : `${sitios.length} ${sitios.length === 1 ? 'sitio' : 'sitios'}`;
}

function mostrarFormularioCrear() {
  const el = document.getElementById('tarjetaCrear');
  if (!el) return;
  el.outerHTML = `
    <form class="db-card db-card--form" id="formCrear">
      <label>Nombre del sitio</label>
      <input type="text" id="nombreNuevoSitio" placeholder="Mi tienda" autocomplete="off">
      <button type="submit" class="ed-btn ed-btn--primary">Crear</button>
    </form>`;

  const input = document.getElementById('nombreNuevoSitio');
  input.focus();

  document.getElementById('formCrear').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const nombre = input.value.trim();
    if (!nombre) return;

    try {
      const resp = await crearSitio(nombre);
      window.location.href = `/editor.html?site=${resp.site.id}`;
    } catch (e) {
      console.error('No se pudo crear el sitio', e);
      if (e.status === 402) await mostrarLimitePlan(e.message);
      else await mostrarAviso(e.message || 'No se pudo crear el sitio. Intenta de nuevo.');
      cargar(); // vuelve a la tarjeta "+" en vez de dejar el formulario esperando un nombre
    }
  });
}

// El listado de sitios se cachea en localStorage y se pinta de inmediato
// al volver al dashboard — sin esto, cada visita esperaba el viaje
// completo a n8n/Neon (uno o dos segundos) antes de mostrar nada. La
// versión cacheada puede quedar un instante desactualizada; el fetch de
// abajo la reemplaza en cuanto responde.
const CACHE_KEY = 'kleysites_sitios_cache';

function leerCacheSitios() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch (e) {
    return null;
  }
}

function guardarCacheSitios(sitios) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(sitios));
  } catch (e) { /* localStorage lleno o deshabilitado: no es crítico, solo se pierde el atajo */ }
}

async function cargar() {
  const cache = leerCacheSitios();
  if (cache) pintarSitios(cache);

  try {
    const resp = await listarSitios();
    const sitios = resp.sitios || [];
    guardarCacheSitios(sitios);
    pintarSitios(sitios);
  } catch (e) {
    console.error('No se pudieron cargar los sitios', e);
    if (String(e.message).includes('401') || String(e.message).toLowerCase().includes('token')) {
      cerrarSesion();
      return;
    }
    if (!cache) grid.innerHTML = `<p class="db-error">No se pudieron cargar tus sitios. Recarga la página.</p>` + tarjetaCrear();
    // si había algo en caché, se queda mostrando eso en vez de un error
  }
}

grid.addEventListener('click', (e) => {
  if (e.target.closest('#tarjetaCrear')) {
    e.preventDefault();
    mostrarFormularioCrear();
  }
});

async function crearDesdePlantilla(boton) {
  const nombre = boton.dataset.nombre;
  const grid2 = document.getElementById('tplGrid');
  grid2.querySelectorAll('.db-tpl-card').forEach((b) => { b.disabled = true; });
  try {
    const resp = await crearSitio(nombre);
    window.location.href = `/editor.html?site=${resp.site.id}`;
  } catch (e) {
    console.error('No se pudo crear el sitio', e);
    if (e.status === 402) await mostrarLimitePlan(e.message);
    else await mostrarAviso(e.message || 'No se pudo crear el sitio. Intenta de nuevo.');
    grid2.querySelectorAll('.db-tpl-card').forEach((b) => { b.disabled = false; });
  }
}

document.getElementById('tplGrid').addEventListener('click', (e) => {
  const card = e.target.closest('.db-tpl-card');
  if (card) crearDesdePlantilla(card);
});

// --- Modal "límite de plan" (distinto del aviso genérico: este sí tiene
// ícono y encabezado propios, para el momento exacto en que se le pide
// al cliente pasar a Pro) ---

const modalLimitePlan = document.getElementById('modalLimitePlan');
let resolverLimitePlan = null;

function mostrarLimitePlan(mensaje) {
  document.getElementById('limitePlanMensaje').textContent = mensaje || 'Ya llegaste al máximo de sitios de tu plan.';
  modalLimitePlan.classList.add('is-open');
  return new Promise((resolve) => { resolverLimitePlan = resolve; });
}

function cerrarLimitePlan() {
  modalLimitePlan.classList.remove('is-open');
  if (resolverLimitePlan) { resolverLimitePlan(); resolverLimitePlan = null; }
}

document.getElementById('btnCerrarLimitePlan').addEventListener('click', cerrarLimitePlan);
modalLimitePlan.addEventListener('click', (e) => { if (e.target === modalLimitePlan) cerrarLimitePlan(); });

cargar();
