/*
  plan.js
  Modal "Ver planes" del menú de cuenta: compara Gratis vs Pro (estilo
  Canva) y marca cuál es el plan real del cliente — sin cobros ni
  checkout (eso no existe todavía), "Pasar a Pro" escribe directo a
  soporte por correo.
*/

import { obtenerPerfil } from './api.js';

export function initPlan() {
  const modal = document.getElementById('modalPlan');
  if (!modal) return;

  const botonesAbrir = document.querySelectorAll('[data-accion="plan"]');
  const btnCerrar = document.getElementById('btnCerrarPlan');
  const btnPasarAPro = document.getElementById('btnPasarAPro');

  async function abrir() {
    document.querySelectorAll('.kley-menu.is-open').forEach((el) => el.classList.remove('is-open'));
    modal.classList.add('is-open');
    modal.querySelectorAll('[data-badge]').forEach((b) => { b.hidden = true; });
    btnPasarAPro.hidden = false;
    try {
      const resp = await obtenerPerfil();
      const plan = resp.perfil.plan === 'pro' ? 'pro' : 'gratis';
      modal.querySelector(`[data-badge="${plan}"]`).hidden = false;
      if (plan === 'pro') btnPasarAPro.hidden = true;
    } catch (e) {
      console.error('No se pudo cargar el plan', e);
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
