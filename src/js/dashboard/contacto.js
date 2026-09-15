/*
  contacto.js
  Ventana flotante del pie de página con el correo de soporte — el correo
  en sí es el único enlace real (se subraya al pasar el mouse y recién ahí
  redirige a Gmail); el resto del modal es solo el mensaje.
*/

export function initContacto() {
  const modal = document.getElementById('modalContacto');
  if (!modal) return;

  const btnAbrir = document.querySelector('[data-accion="contacto"]');
  const btnCerrar = document.getElementById('btnCerrarContacto');

  function abrir() { modal.classList.add('is-open'); }
  function cerrar() { modal.classList.remove('is-open'); }

  btnAbrir?.addEventListener('click', abrir);
  btnCerrar.addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });
}
