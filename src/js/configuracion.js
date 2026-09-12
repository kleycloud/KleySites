/*
  configuracion.js
  Modal "Configuración" del menú de cuenta — hoy solo apariencia (tema).
  Antes esto era un botón deshabilitado con "Próximamente"; separado de
  perfil.js porque no tiene nada que ver con la cuenta del cliente en sí.
*/

import { temaGuardado, elegirTema } from './theme.js';

export function initConfiguracion() {
  const modal = document.getElementById('modalConfiguracion');
  if (!modal) return;

  const botonesAbrir = document.querySelectorAll('[data-accion="configuracion"]');
  const btnCerrar = document.getElementById('btnCerrarConfiguracion');
  const radios = modal.querySelectorAll('input[name="tema"]');

  function abrir() {
    document.querySelectorAll('.kley-menu.is-open').forEach((el) => el.classList.remove('is-open'));
    const actual = temaGuardado();
    radios.forEach((r) => { r.checked = r.value === actual; });
    modal.classList.add('is-open');
  }
  function cerrar() {
    modal.classList.remove('is-open');
  }

  botonesAbrir.forEach((b) => b.addEventListener('click', abrir));
  btnCerrar.addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });
  radios.forEach((r) => r.addEventListener('change', () => { if (r.checked) elegirTema(r.value); }));
}

initConfiguracion();
