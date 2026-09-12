/*
  perfil.js
  Foto de perfil y correo del cliente — compartido entre dashboard.html y
  editor.html. Sube directo a Cloudinary desde el navegador (preset sin
  firmar: no hace falta backend para la subida en sí) y solo le pide al
  backend que guarde la URL resultante en Neon.
*/

import { obtenerPerfil, guardarAvatarUrl, guardarNombre, clienteId } from './api.js';
import { subirACloudinary } from './cloudinary.js';
import { nombreODeMail } from './nombre.js';

function pintarAvatares(url, inicial) {
  document.querySelectorAll('[data-avatar]').forEach((el) => {
    el.innerHTML = url ? `<img src="${url}" alt="">` : inicial;
  });
}

// El saludo del dashboard (hero.js) lee esto mismo — si el usuario cambia
// su nombre con el modal abierto desde ahí, se ve reflejado sin recargar.
function pintarSaludos(nombre) {
  document.querySelectorAll('[data-nombre-saludo]').forEach((el) => { el.textContent = nombre; });
}

export function initPerfil() {
  const modal = document.getElementById('modalPerfil');
  if (!modal) return;

  const btnAbrir = document.querySelector('[data-accion="perfil"]');
  const btnCerrar = document.getElementById('btnCerrarPerfil');
  const inputArchivo = document.getElementById('inputAvatarArchivo');
  const btnSubir = document.getElementById('btnSubirAvatar');
  const btnQuitar = document.getElementById('btnQuitarAvatar');
  const correoEl = document.getElementById('perfilCorreo');
  const errorEl = document.getElementById('perfilError');
  const inputNombre = document.getElementById('inputNombrePerfil');
  const btnGuardarNombre = document.getElementById('btnGuardarNombrePerfil');

  let inicial = '?';
  let avatarActual = null;

  async function cargar() {
    try {
      const resp = await obtenerPerfil();
      correoEl.textContent = resp.perfil.email || '';
      inicial = (resp.perfil.email || '?')[0].toUpperCase();
      avatarActual = resp.perfil.avatar_url || null;
      pintarAvatares(avatarActual, inicial);
      btnQuitar.hidden = !avatarActual;
      inputNombre.value = nombreODeMail(resp.perfil.nombre, resp.perfil.email) || '';
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
      avatarActual = url;
      pintarAvatares(url, inicial);
      btnQuitar.hidden = false;
    } catch (e) {
      console.error('No se pudo actualizar el avatar', e);
      errorEl.textContent = 'No se pudo subir la foto. Intenta de nuevo.';
      errorEl.hidden = false;
    }
    inputArchivo.value = '';
  });

  btnGuardarNombre.addEventListener('click', async () => {
    const nombre = inputNombre.value.trim();
    if (!nombre) return;
    errorEl.hidden = true;
    try {
      await guardarNombre(nombre);
      pintarSaludos(nombre);
    } catch (e) {
      console.error('No se pudo guardar el nombre', e);
      errorEl.textContent = 'No se pudo guardar el nombre. Intenta de nuevo.';
      errorEl.hidden = false;
    }
  });

  btnQuitar.addEventListener('click', async () => {
    if (!avatarActual) return;
    errorEl.hidden = true;
    try {
      await guardarAvatarUrl(null);
      avatarActual = null;
      pintarAvatares(null, inicial);
      btnQuitar.hidden = true;
    } catch (e) {
      console.error('No se pudo quitar el avatar', e);
      errorEl.textContent = 'No se pudo quitar la foto. Intenta de nuevo.';
      errorEl.hidden = false;
    }
  });

  cargar();
}

initPerfil();
