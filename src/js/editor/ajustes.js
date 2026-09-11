/*
  ajustes.js
  Panel "Ajustes": renombrar el sitio, ver su dirección/fecha de
  creación, y eliminarlo (con confirmación escribiendo el nombre exacto).
*/

import * as api from '../api.js';
import { subirACloudinary } from '../cloudinary.js';

let sitioActual = null;

export function setSitioActual(sitio) {
  sitioActual = sitio;
  renderAjustesSitio();
}

export function getSitioActual() {
  return sitioActual;
}

function renderAjustesSitio() {
  if (!sitioActual) return;
  document.getElementById('inputNombreSitioAjustes').value = sitioActual.nombre || '';
  document.getElementById('ajustesSlug').value = sitioActual.slug ? `${sitioActual.slug}.pages.dev` : '';
  document.getElementById('ajustesCreado').value = sitioActual.created_at
    ? new Date(sitioActual.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  renderFaviconPreview();
}

function renderFaviconPreview() {
  const cont = document.getElementById('faviconPreview');
  if (sitioActual?.favicon_url) {
    cont.innerHTML = `<img src="${sitioActual.favicon_url}" alt="">`;
  } else {
    cont.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>';
  }
}

export function initAjustes() {
  const ajustesError = document.getElementById('ajustesError');
  function mostrarErrorAjustes(msg) {
    ajustesError.textContent = msg;
    ajustesError.hidden = false;
  }

  document.getElementById('btnGuardarNombreSitio').addEventListener('click', async () => {
    const nombre = document.getElementById('inputNombreSitioAjustes').value.trim();
    if (!nombre || !sitioActual) return;
    ajustesError.hidden = true;
    try {
      const resp = await api.renombrarSitio(sitioActual.id, nombre);
      sitioActual = resp.site;
      document.getElementById('siteName').textContent = sitioActual.nombre;
    } catch (e) {
      console.error('No se pudo renombrar el sitio', e);
      mostrarErrorAjustes('No se pudo guardar el nombre. Intenta de nuevo.');
    }
  });

  const faviconError = document.getElementById('faviconError');
  const inputFavicon = document.getElementById('inputFaviconArchivo');
  document.getElementById('btnSubirFavicon').addEventListener('click', () => inputFavicon.click());
  inputFavicon.addEventListener('change', async () => {
    const archivo = inputFavicon.files[0];
    if (!archivo || !sitioActual) return;
    faviconError.hidden = true;
    try {
      const url = await subirACloudinary(archivo, `clientes/${api.clienteId()}/sitios/${sitioActual.id}`);
      const resp = await api.guardarFaviconSitio(sitioActual.id, url);
      sitioActual.favicon_url = resp.favicon_url;
      renderFaviconPreview();
    } catch (e) {
      console.error('No se pudo actualizar el favicon', e);
      faviconError.textContent = 'No se pudo subir el favicon. Intenta de nuevo.';
      faviconError.hidden = false;
    }
    inputFavicon.value = '';
  });

  document.getElementById('btnEliminarSitio').addEventListener('click', () => {
    document.getElementById('confirmarEliminarSitio').hidden = false;
  });

  document.getElementById('btnConfirmarEliminarSitio').addEventListener('click', async () => {
    if (!sitioActual) return;
    const escrito = document.getElementById('inputConfirmarNombreSitio').value.trim();
    ajustesError.hidden = true;
    if (escrito !== sitioActual.nombre) {
      mostrarErrorAjustes('El nombre no coincide.');
      return;
    }
    try {
      await api.eliminarSitio(sitioActual.id);
      window.location.href = '/dashboard.html';
    } catch (e) {
      console.error('No se pudo eliminar el sitio', e);
      mostrarErrorAjustes('No se pudo eliminar el sitio. Intenta de nuevo.');
    }
  });
}
