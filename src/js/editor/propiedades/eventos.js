/*
  eventos.js
  Cableado del panel de propiedades: cada control escribe en el bloque
  seleccionado vía actualizarCampo (que re-renderiza solo el lienzo, así
  el campo con foco no se pierde).
*/

import { state } from '../state.js';
import { actualizarCampo, eliminarBloqueSeleccionado } from '../bloques.js';
import { marcarGrupo } from './panel.js';

const LADOS = ['arriba', 'derecha', 'abajo', 'izquierda'];

function escribir(campo, valor) {
  if (state.selectedId == null) return;
  actualizarCampo(state.selectedId, campo, valor);
}

export function initPropiedades(cont) {
  // Solo "input": dispara con cada tecleo y con cada cambio de <select>.
  // "change" se dispara también al perder foco si el valor cambió,
  // duplicando la escritura y ensuciando el historial de deshacer.
  cont.addEventListener('input', (e) => {
    const el = e.target;

    if (el.dataset.campoTodos) {
      LADOS.forEach((lado) => {
        const clave = `estilos.${el.dataset.campoTodos}_${lado}`;
        const input = cont.querySelector(`[data-campo="${clave}"]`);
        if (input) input.value = el.value;
        escribir(clave, el.value);
      });
      return;
    }

    if (el.dataset.colorPara) {
      const texto = cont.querySelector(`[data-campo="${el.dataset.colorPara}"]`);
      if (texto) texto.value = el.value;
      escribir(el.dataset.colorPara, el.value);
      return;
    }

    const campo = el.dataset.campo;
    if (!campo) return;

    if (el.type === 'checkbox') { escribir(campo, el.checked ? 'si' : ''); return; }

    if (el.type === 'range') {
      const etiqueta = cont.querySelector(`[data-rango-valor="${campo}"]`);
      if (etiqueta) etiqueta.textContent = el.value + (etiqueta.textContent.replace(/^[\d.-]+/, ''));
    }
    if (el.type === 'text' && /^#[0-9a-f]{6}$/i.test(el.value)) {
      const picker = cont.querySelector(`[data-color-para="${campo}"]`);
      if (picker) picker.value = el.value;
    }
    escribir(campo, el.value);
  });

  cont.addEventListener('toggle', (e) => {
    const grupo = e.target.closest('.ed-prop-grupo');
    if (grupo) marcarGrupo(grupo.dataset.grupo, grupo.open);
  }, true);

  cont.addEventListener('click', (e) => {
    if (e.target.closest('[data-accion="eliminar"]')) eliminarBloqueSeleccionado();
  });
}
