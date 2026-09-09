/*
  publicar.js
  Botón "Publicar": manda el sitio y la página actual a n8n, que renderiza
  el HTML final y lo despliega a Cloudflare Pages. El deploy puede tardar
  unos segundos — el botón se deshabilita mientras tanto. Al terminar,
  un modal muestra el enlace: un texto chiquito en la barra superior no
  alcanza para algo tan importante como "tu sitio ya está en internet".
*/

import * as api from '../api.js';
import { state } from './state.js';

function abrirModalPublicado(url) {
  const modal = document.getElementById('modalPublicado');
  document.getElementById('publicadoUrlInput').value = url;
  document.getElementById('linkVerSitio').href = url;
  modal.classList.add('is-open');
}

export function initPublicar() {
  const btn = document.getElementById('btnPublicar');
  const status = document.getElementById('publishStatus');
  const modal = document.getElementById('modalPublicado');
  const urlInput = document.getElementById('publicadoUrlInput');

  document.getElementById('btnCerrarPublicado').addEventListener('click', () => modal.classList.remove('is-open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('is-open'); });

  document.getElementById('btnCopiarUrlPublicado').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(urlInput.value);
    } catch (e) {
      urlInput.select(); // sin permiso de portapapeles: al menos deja seleccionado para Cmd/Ctrl+C
    }
  });

  btn.addEventListener('click', async () => {
    if (!state.siteId) return;
    btn.disabled = true;
    status.textContent = 'Publicando…';

    try {
      const resp = await api.publicarSitio(state.siteId, state.pageId);
      status.textContent = '';
      if (resp.url) abrirModalPublicado(resp.url);
    } catch (e) {
      console.error('No se pudo publicar', e);
      status.textContent = 'No se pudo publicar. Intenta de nuevo.';
    } finally {
      btn.disabled = false;
    }
  });
}
