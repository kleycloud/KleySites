/*
  history.js
  Deshacer / rehacer: snapshots del estado completo (la escala de datos es
  pequeña y así no hay que razonar qué revertir en cada tipo de mutación),
  más la limpieza de huérfanos en Neon cuando un deshacer/rehacer hace
  desaparecer un bloque que ya se había guardado.
*/

import * as api from '../api.js';
import { state } from './state.js';

let historial = [];
let historialFuturo = [];
let edicionEnCurso = null; // temporizador del debounce de edición de campos

function actualizarBotonesHistorial() {
  const btnDeshacer = document.getElementById('btnDeshacer');
  const btnRehacer = document.getElementById('btnRehacer');
  if (btnDeshacer) btnDeshacer.disabled = historial.length === 0;
  if (btnRehacer) btnRehacer.disabled = historialFuturo.length === 0;
}

export function guardarSnapshot() {
  historial.push(JSON.stringify(state.blocks));
  if (historial.length > 100) historial.shift();
  historialFuturo = [];
  actualizarBotonesHistorial();
}

// Coalesce de ediciones rápidas (cada tecleo en un campo) en un solo paso
// de deshacer, en vez de un snapshot por letra escrita.
export function registrarEdicionDebounced() {
  if (!edicionEnCurso) guardarSnapshot();
  clearTimeout(edicionEnCurso);
  edicionEnCurso = setTimeout(() => { edicionEnCurso = null; }, 600);
}

function remoteIdsPresentes(lista) {
  return new Set(lista.filter((b) => b.remoteId != null).map((b) => b.remoteId));
}

// Si deshacer/rehacer hace desaparecer un bloque que ya se había guardado
// en Neon (autoguardado corrió antes de que el usuario presionara
// deshacer), ese bloque quedaría huérfano en la base — se borra en Neon
// también, igual que el botón "Eliminar bloque".
function limpiarHuerfanos(antes, despues) {
  antes.forEach((remoteId) => {
    if (!despues.has(remoteId)) {
      api.eliminarBloque(remoteId).catch((e) => console.error('No se pudo limpiar huérfano', remoteId, e));
    }
  });
}

// Devuelven true si sí hubo un cambio de estado (para que quien llame
// decida si renderizar y reprogramar el guardado).
export function deshacer() {
  if (historial.length === 0) return false;
  const antes = remoteIdsPresentes(state.blocks);
  historialFuturo.push(JSON.stringify(state.blocks));
  state.blocks = JSON.parse(historial.pop());
  state.selectedId = null;
  actualizarBotonesHistorial();
  limpiarHuerfanos(antes, remoteIdsPresentes(state.blocks));
  return true;
}

export function rehacer() {
  if (historialFuturo.length === 0) return false;
  const antes = remoteIdsPresentes(state.blocks);
  historial.push(JSON.stringify(state.blocks));
  state.blocks = JSON.parse(historialFuturo.pop());
  state.selectedId = null;
  actualizarBotonesHistorial();
  limpiarHuerfanos(antes, remoteIdsPresentes(state.blocks));
  return true;
}
