/*
  perfil.js
  Foto de perfil y correo del cliente — compartido entre dashboard.html y
  editor.html. Sube directo a Cloudinary desde el navegador (preset sin
  firmar: no hace falta backend para la subida en sí) y solo le pide a
  n8n que guarde la URL resultante en Neon.
*/

import { obtenerPerfil, guardarAvatarUrl } from './api.js';

const CLOUD_NAME = 'aup5guac';
const UPLOAD_PRESET = 'kleysites_uploads';

function pintarAvatares(url, inicial) {
  document.querySelectorAll('[data-avatar]').forEach((el) => {
    el.innerHTML = url ? `<img src="${url}" alt="">` : inicial;
  });
}

async function subirACloudinary(archivo) {
  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('No se pudo subir la imagen');
  const data = await res.json();
  return data.secure_url;
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
      const url = await subirACloudinary(archivo);
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
