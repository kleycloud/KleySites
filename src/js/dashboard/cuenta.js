/*
  cuenta.js
  Datos del cliente para el saludo y la topbar (nombre, plan) — una sola
  llamada a /perfil, reusada por dashboard.js para no repetirla al armar
  las estadísticas.
*/

import { obtenerPerfil } from '../api.js';
import { nombreODeMail } from '../nombre.js';

function pintarNombre(nombre) {
  document.querySelectorAll('[data-nombre-saludo]').forEach((el) => { el.textContent = nombre; });
}

function pintarPlan(plan) {
  document.querySelectorAll('[data-plan-etiqueta]').forEach((el) => { el.textContent = `Plan ${plan === 'pro' ? 'Pro' : 'Gratis'}`; });
}

// Devuelve { email, plan, nombre } (o null si falló) para que quien
// llame reuse el plan sin pedirlo de nuevo.
export async function initCuenta() {
  try {
    const resp = await obtenerPerfil();
    pintarNombre(nombreODeMail(resp.perfil.nombre, resp.perfil.email) || 'de nuevo');
    pintarPlan(resp.perfil.plan);
    return resp.perfil;
  } catch (e) {
    console.error('No se pudo cargar la cuenta', e);
    return null;
  }
}
