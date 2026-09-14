/*
  notificaciones.js
  La campanita de la topbar. Todavía no hay un sistema de notificaciones
  real (nada que avisar), así que el punto naranja (#notifPunto) se queda
  oculto siempre — está listo en el HTML/CSS para cuando exista algo real
  que mostrar, en vez de simular una notificación que no es.
*/

import { mostrarAviso } from '../aviso.js';

export function initNotificaciones() {
  const btn = document.getElementById('btnNotificaciones');
  if (!btn) return;
  btn.addEventListener('click', () => {
    mostrarAviso('Por ahora no tienes notificaciones. Te avisaremos aquí apenas haya algo nuevo.', 'Notificaciones');
  });
}
