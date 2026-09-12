/*
  plan.js
  Modal "Mi plan" del menú de cuenta: solo muestra en qué plan estás, sin
  cobros ni checkout (eso no existe todavía) — quien necesite más sitios
  escribe directo a soporte.
*/

import { obtenerPerfil } from './api.js';

const PLANES = {
  gratis: {
    titulo: 'Plan Gratis',
    descripcion: 'Puedes tener 1 sitio publicado. Si necesitas más, escríbenos a kleysite@gmail.com.',
  },
  pro: {
    titulo: 'Plan Pro',
    descripcion: 'Puedes tener todos los sitios que quieras, sin la marca de KleySites. ¡Gracias por apoyarnos!',
  },
};

export function initPlan() {
  const modal = document.getElementById('modalPlan');
  if (!modal) return;

  const botonesAbrir = document.querySelectorAll('[data-accion="plan"]');
  const btnCerrar = document.getElementById('btnCerrarPlan');
  const tituloEl = document.getElementById('planTitulo');
  const descripcionEl = document.getElementById('planDescripcion');

  async function abrir() {
    document.querySelectorAll('.kley-menu.is-open').forEach((el) => el.classList.remove('is-open'));
    modal.classList.add('is-open');
    tituloEl.textContent = 'Cargando…';
    descripcionEl.textContent = '';
    try {
      const resp = await obtenerPerfil();
      const info = PLANES[resp.perfil.plan] || PLANES.gratis;
      tituloEl.textContent = info.titulo;
      descripcionEl.textContent = info.descripcion;
    } catch (e) {
      console.error('No se pudo cargar el plan', e);
      tituloEl.textContent = 'Tu plan';
      descripcionEl.textContent = 'No se pudo cargar la información. Intenta de nuevo.';
    }
  }
  function cerrar() {
    modal.classList.remove('is-open');
  }

  botonesAbrir.forEach((b) => b.addEventListener('click', abrir));
  btnCerrar.addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });
}

initPlan();
