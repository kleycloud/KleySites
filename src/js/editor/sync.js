/*
  sync.js
  Autoguardado hacia Neon: guarda los bloques modificados, respetando el
  orden padres-antes-que-hijos para que los hijos se guarden con el
  parent_id real del servidor.
*/

import * as api from '../api.js';
import { state } from './state.js';

let statusTimer = null;

export function marcarEstado(texto, persistente = false) {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  el.textContent = texto;
  clearTimeout(statusTimer);
  if (!persistente) statusTimer = setTimeout(() => { el.textContent = ''; }, 2000);
}

export async function sincronizar() {
  if (!state.pageId) return;
  marcarEstado('Guardando…', true);

  let progreso = true;
  const yaGuardados = new Set();
  let huboError = false;

  while (progreso) {
    progreso = false;
    for (const b of state.blocks) {
      if (yaGuardados.has(b.id)) continue;
      const padre = b.parent_id == null ? null : state.blocks.find((x) => x.id === b.parent_id);
      const padreListo = b.parent_id == null || (padre && padre.remoteId != null);
      if (!padreListo) continue;

      try {
        const resp = await api.guardarBloque({
          block_id: b.remoteId ?? null,
          page_id: state.pageId,
          tipo: b.tipo,
          contenido: b.contenido,
          orden: b.orden,
          zona: b.zona,
          parent_id: padre ? padre.remoteId : null,
          estilos: b.estilos,
        });
        b.remoteId = resp.bloque.id;
      } catch (e) {
        console.error('No se pudo guardar el bloque', b.id, e);
        huboError = true;
      }
      yaGuardados.add(b.id);
      progreso = true;
    }
  }

  marcarEstado(huboError ? 'No se pudo guardar' : 'Guardado');
}

let guardadoTimer = null;
export function programarGuardado() {
  clearTimeout(guardadoTimer);
  guardadoTimer = setTimeout(sincronizar, 800);
}
