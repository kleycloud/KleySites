/*
  aviso.js
  Reemplaza el alert() nativo del navegador por un modal con el estilo de
  la marca — se usa en dashboard.html y editor.html por igual. El modal
  se crea la primera vez que se necesita, no hace falta HTML estático en
  cada página. Devuelve una promesa que se resuelve cuando el usuario lo
  cierra, para poder esperar antes de hacer limpieza (ej. refrescar la
  lista de sitios después de un aviso de límite de plan).
*/

let resolverPendiente = null;

function asegurarModal() {
  let modal = document.getElementById('modalAviso');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'ed-modal-overlay';
  modal.id = 'modalAviso';
  modal.innerHTML = `
    <div class="ed-modal">
      <div class="ed-modal-header">
        <span class="ed-modal-title" id="avisoTitulo">Aviso</span>
      </div>
      <p class="ed-modal-hint" id="avisoMensaje"></p>
      <div class="ed-modal-footer">
        <button type="button" class="ed-btn ed-btn--primary" id="btnAvisoOk">Entendido</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  function cerrar() {
    modal.classList.remove('is-open');
    if (resolverPendiente) { resolverPendiente(); resolverPendiente = null; }
  }
  document.getElementById('btnAvisoOk').addEventListener('click', cerrar);
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

  return modal;
}

export function mostrarAviso(mensaje, titulo = 'Aviso') {
  const modal = asegurarModal();
  document.getElementById('avisoTitulo').textContent = titulo;
  document.getElementById('avisoMensaje').textContent = mensaje;
  modal.classList.add('is-open');
  return new Promise((resolve) => { resolverPendiente = resolve; });
}

// Los enlaces "Ayuda"/"Soporte" usan href="mailto:..." para que se pueda
// copiar el correo con clic derecho, pero un clic normal deja que el
// navegador muestre su propio aviso de "¿abrir Mail?" — se reemplaza por
// este mismo modal de marca, sin tocar el href.
const CORREO_SOPORTE = 'kleysite@gmail.com';

export function initAyuda() {
  document.querySelectorAll('[data-accion="ayuda"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarAviso(`Escríbenos a ${CORREO_SOPORTE} y te respondemos.`, 'Ayuda');
    });
  });
}
