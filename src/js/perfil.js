/*
  perfil.js
  Foto de perfil y correo del cliente — compartido entre dashboard.html y
  editor.html. Sube directo a Cloudinary desde el navegador (preset sin
  firmar: no hace falta backend para la subida en sí) y solo le pide a
  n8n que guarde la URL resultante en Neon.
*/

import { obtenerPerfil, guardarAvatarUrl, clienteId } from './api.js';
import { subirACloudinary } from './cloudinary.js';

function pintarAvatares(url, inicial) {
  document.querySelectorAll('[data-avatar]').forEach((el) => {
    el.innerHTML = url ? `<img src="${url}" alt="">` : inicial;
  });
}

export function initPerfil() {
  const modal = document.getElementById('modalPerfil');
  if (!modal) return;

  const btnAbrir = document.querySelector('[data-accion="perfil"]');
  const btnCerrar = document.getElementById('btnCerrarPerfil');
  const inputArchivo = document.getElementById('inputAvatarArchivo');
  const btnSubir = document.getElementById('btnSubirAvatar');
  const correoEl = document.getElementById('perfilCorreo');
  const errorEl = document.getElementById('perfilError');

  let inicial = '?';

  async function cargar() {
    try {
      const resp = await obtenerPerfil();
      correoEl.textContent = resp.perfil.email || '';
      inicial = (resp.perfil.email || '?')[0].toUpperCase();
      pintarAvatares(resp.perfil.avatar_url, inicial);
    } catch (e) {
      console.error('No se pudo cargar el perfil', e);
    }
  }

  function abrir() {
    document.querySelectorAll('.kley-menu.is-open').forEach((el) => el.classList.remove('is-open'));
    errorEl.hidden = true;
    modal.classList.add('is-open');
  }
  function cerrar() {
    modal.classList.remove('is-open');
  }

  btnAbrir?.addEventListener('click', abrir);
  btnCerrar.addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

  btnSubir.addEventListener('click', () => inputArchivo.click());
  inputArchivo.addEventListener('change', async () => {
    const archivo = inputArchivo.files[0];
    if (!archivo) return;
    errorEl.hidden = true;
    try {
      const url = await subirACloudinary(archivo, `clientes/${clienteId()}/perfil`);
      await guardarAvatarUrl(url);
      pintarAvatares(url, inicial);
    } catch (e) {
      console.error('No se pudo actualizar el avatar', e);
      errorEl.textContent = 'No se pudo subir la foto. Intenta de nuevo.';
      errorEl.hidden = false;
    }
    inputArchivo.value = '';
  });

  cargar();
}

initPerfil();
