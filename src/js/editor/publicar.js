/*
  publicar.js
  Botón "Publicar": manda el sitio y la página actual a n8n, que renderiza
  el HTML final y lo despliega a Cloudflare Pages. El deploy puede tardar
  unos segundos — el botón se deshabilita mientras tanto. Al terminar,
  siempre se avisa algo claro (modal con el enlace si vino en la
  respuesta, aviso genérico si no vino, o error) — nunca se queda en
  silencio como si no hubiera pasado nada.
*/

import * as api from '../api.js';
import { state } from './state.js';
import { mostrarAviso } from '../aviso.js';

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
      const url = resp.url || (resp.slug ? `https://${resp.slug}.pages.dev` : null);
      if (url) {
        abrirModalPublicado(url);
      } else {
        await mostrarAviso('Tu sitio se publicó, pero no se pudo determinar el enlace todavía.', '¡Publicado!');
      }
    } catch (e) {
      console.error('No se pudo publicar', e);
      status.textContent = '';
      await mostrarAviso(e.message || 'No se pudo publicar. Intenta de nuevo.', 'No se pudo publicar');
    } finally {
      btn.disabled = false;
    }
  });
}
