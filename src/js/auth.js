const BASE = import.meta.env.VITE_API_BASE || "https://kleysites-api.vercel.app/api";
let emailActual = "";

// Ya hay una sesión guardada (login previo, token vigente 7 días) —
// no tiene sentido pedir login de nuevo hasta que el usuario cierre sesión.
if (localStorage.getItem('kleysites_token')) {
  window.location.href = '/dashboard.html';
}

function mostrarPaso(id) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('show'));
  document.getElementById(id).classList.add('show');
}

function irAEmail() { mostrarPaso('stepEmail'); }
function volverAInicio() { mostrarPaso('stepInicio'); }
function volverAEmail() { mostrarPaso('stepEmail'); }

function msg(id, texto, tipo) {
  const el = document.getElementById(id);
  el.textContent = texto;
  el.className = 'msg show ' + tipo;
}

async function continuarConEmail() {
  const email = document.getElementById('email').value.trim();
  if (!email) { msg('msgEmail', 'Escribe tu correo.', 'err'); return; }
  emailActual = email;

  try {
    const res = await fetch(BASE + '/kleysites/enviar-codigo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (!res.ok) {
      msg('msgEmail', data.error || 'Ocurrió un error.', 'err');
      return;
    }

    mostrarPaso('stepCode');
  } catch (e) {
    msg('msgEmail', 'No se pudo conectar.', 'err');
  }
}

async function confirmarCodigo() {
  const codigo = document.getElementById('codigo').value.trim();
  try {
    const res = await fetch(BASE + '/kleysites/confirmar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailActual, codigo })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('kleysites_token', data.token);
      msg('msgCodigo', '¡Listo! Sesión iniciada.', 'ok');
      window.location.href = '/dashboard.html';
    } else {
      msg('msgCodigo', data.error || 'Código incorrecto.', 'err');
    }
  } catch (e) {
    msg('msgCodigo', 'No se pudo conectar.', 'err');
  }
}

function handleGoogleSignIn(response) {
  fetch(BASE + '/kleysites/google-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: response.credential })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('kleysites_token', data.token);
      window.location.href = '/dashboard.html';
    } else {
      alert(data.error || 'Error al iniciar sesión con Google');
    }
  })
  .catch(err => console.error('Error:', err));
}

function initGoogleButton() {
  const contenedor = document.getElementById('googleBtn');
  if (!contenedor) return;

  google.accounts.id.initialize({
    client_id: '26646131722-r6qdviik8qm17cn5smt0b2gqh47qjb30.apps.googleusercontent.com',
    callback: handleGoogleSignIn
  });
  google.accounts.id.renderButton(contenedor, {
    theme: 'outline',
    size: 'large',
    shape: 'rectangular',
    width: contenedor.clientWidth || 300
  });
}

function loopEscena() {
  const el = document.getElementById('sceneInner');
  el.style.opacity = '0';
  setTimeout(() => {
    el.classList.add('reset');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.remove('reset');
      el.style.opacity = '1';
    }));
  }, 400);
}
setInterval(loopEscena, 7600);

initGoogleButton();
document.getElementById('btnIrAEmail').addEventListener('click', irAEmail);
document.getElementById('btnContinuarEmail').addEventListener('click', continuarConEmail);
document.getElementById('btnVolverInicio').addEventListener('click', volverAInicio);
document.getElementById('btnConfirmarCodigo').addEventListener('click', confirmarCodigo);
document.getElementById('btnVolverEmail').addEventListener('click', volverAEmail);
