export function cerrarSesion() {
  localStorage.removeItem('kleysites_token');
  window.location.href = '/';
}

export function initAccountMenu(toggleBtn, menuEl) {
  if (!toggleBtn || !menuEl) return;

  function cerrarSiFuera(e) {
    if (!menuEl.contains(e.target) && !toggleBtn.contains(e.target)) cerrar();
  }
  function cerrarConEscape(e) {
    if (e.key === 'Escape') cerrar();
  }
  function abrir() {
    menuEl.classList.add('is-open');
    document.addEventListener('click', cerrarSiFuera);
    document.addEventListener('keydown', cerrarConEscape);
  }
  function cerrar() {
    menuEl.classList.remove('is-open');
    document.removeEventListener('click', cerrarSiFuera);
    document.removeEventListener('keydown', cerrarConEscape);
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menuEl.classList.contains('is-open')) cerrar(); else abrir();
  });

  const btnCerrarSesion = menuEl.querySelector('[data-accion="cerrar-sesion"]');
  if (btnCerrarSesion) btnCerrarSesion.addEventListener('click', cerrarSesion);
}
