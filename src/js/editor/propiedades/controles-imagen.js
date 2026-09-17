/*
  controles-imagen.js
  Control "imagen" del panel de propiedades: vista previa + Subir (archivo
  → Cloudinary → URL) + Quitar + campo para pegar una URL. Mismo patrón
  que el favicon en ajustes.js; la carpeta agrupa lo subido por cliente y
  sitio.
*/

import { state, leerCampo } from '../state.js';
import { escapeHTML } from '../../render/sanear.js';
import { subirACloudinary } from '../../cloudinary.js';
import * as api from '../../api.js';

const ICONO_VACIO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M4 17l5-5 4 4 3-2 4 4"/></svg>';

function previewHTML(url) {
  return url ? `<img src="${escapeHTML(url)}" alt="">` : ICONO_VACIO;
}

export function imagen(b, c) {
  const url = leerCampo(b, c.key);
  return `<label>${c.label}</label>
    <div class="ed-imagen" data-imagen="${c.key}">
      <div class="ed-imagen-preview">${previewHTML(url)}</div>
      <div class="ed-imagen-acciones">
        <button type="button" class="ed-btn ed-btn--secondary" data-imagen-subir>${url ? 'Cambiar' : 'Subir'}</button>
        <button type="button" class="ed-btn ed-btn--secondary" data-imagen-quitar${url ? '' : ' hidden'}>Quitar</button>
      </div>
      <input type="file" accept="image/*" hidden data-imagen-archivo>
      <input type="text" data-campo="${c.key}" value="${escapeHTML(url)}" placeholder="o pega una URL https://…">
      <p class="ed-imagen-error" hidden></p>
    </div>`;
}

export function refrescarPreviewImagen(wrap, url) {
  wrap.querySelector('.ed-imagen-preview').innerHTML = previewHTML(url);
}

export function initControlImagen(cont, escribir, refrescarPanel) {
  cont.addEventListener('click', (e) => {
    const wrap = e.target.closest('[data-imagen]');
    if (!wrap) return;
    if (e.target.closest('[data-imagen-subir]')) wrap.querySelector('[data-imagen-archivo]').click();
    if (e.target.closest('[data-imagen-quitar]')) { escribir(wrap.dataset.imagen, ''); refrescarPanel(); }
  });

  cont.addEventListener('change', async (e) => {
    const input = e.target.closest('[data-imagen-archivo]');
    if (!input) return;
    const wrap = input.closest('[data-imagen]');
    const archivo = input.files[0];
    input.value = '';
    if (!archivo) return;

    const btn = wrap.querySelector('[data-imagen-subir]');
    const error = wrap.querySelector('.ed-imagen-error');
    btn.disabled = true;
    btn.textContent = 'Subiendo…';
    error.hidden = true;
    try {
      const url = await subirACloudinary(archivo, `clientes/${api.clienteId()}/sitios/${state.siteId}`);
      escribir(wrap.dataset.imagen, url);
      refrescarPanel();
    } catch (err) {
      console.error('No se pudo subir la imagen', err);
      btn.disabled = false;
      btn.textContent = 'Subir';
      error.textContent = 'No se pudo subir la imagen. Intenta de nuevo.';
      error.hidden = false;
    }
  });
}
