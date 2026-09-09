/*
  ajustes.js
  Panel "Ajustes": renombrar el sitio, ver su dirección/fecha de
  creación, y eliminarlo (con confirmación escribiendo el nombre exacto).
*/

import * as api from '../api.js';

let sitioActual = null;

export function setSitioActual(sitio) {
  sitioActual = sitio;
  renderAjustesSitio();
}

function renderAjustesSitio() {
  if (!sitioActual) return;
  document.getElementById('inputNombreSitioAjustes').value = sitioActual.nombre || '';
  document.getElementById('ajustesSlug').value = sitioActual.slug ? `${sitioActual.slug}.pages.dev` : '';
  document.getElementById('ajustesCreado').value = sitioActual.created_at
    ? new Date(sitioActual.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
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
