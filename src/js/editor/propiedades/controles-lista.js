/*
  controles-lista.js
  Control "lista": filas repetidas con N columnas (texto, texto largo o
  select), con agregar/quitar. El campo `c.columnas` describe cada
  columna; `c.nuevo` es la fila que se agrega. Se guarda como JSON string
  en una sola clave de `contenido` (ver render/lista.js).
*/

import { leerCampo } from '../state.js';
import { escapeHTML } from '../../render/sanear.js';
import { parsearLista } from '../../render/lista.js';

function celdaHTML(col, valor) {
  const v = escapeHTML(valor ?? '');
  if (col.tipo === 'select') {
    const opciones = col.opciones.map((o) => {
      const [val, etiqueta] = Array.isArray(o) ? o : [o, o];
      return `<option value="${val}"${val === valor ? ' selected' : ''}>${etiqueta}</option>`;
    }).join('');
    return `<label>${col.label}</label><select data-col="${col.k}">${opciones}</select>`;
  }
  if (col.tipo === 'textarea') return `<label>${col.label}</label><textarea data-col="${col.k}" rows="2">${v}</textarea>`;
  return `<label>${col.label}</label><input type="text" data-col="${col.k}" value="${v}"${col.placeholder ? ` placeholder="${col.placeholder}"` : ''}>`;
}

export function lista(b, c) {
  const filas = parsearLista(leerCampo(b, c.key));
  const filasHTML = filas.map((fila, i) => `
    <div class="ed-lista-fila" data-fila="${i}">
      <div class="ed-lista-fila-cab">
        <span>${i + 1}</span>
        <button type="button" class="ed-icon-btn ed-lista-quitar" data-lista-quitar="${i}" title="Quitar">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      ${c.columnas.map((col) => celdaHTML(col, fila[col.k])).join('')}
    </div>`).join('');
  return `<label>${c.label}</label>
    <div class="ed-lista" data-lista="${c.key}" data-columnas="${c.columnas.map((col) => col.k).join(',')}">
      ${filasHTML || '<p class="ed-lista-vacia">Todavía no hay nada. Agrega la primera.</p>'}
      <button type="button" class="ed-btn ed-btn--secondary ed-lista-agregar" data-lista-agregar>+ ${c.agregar || 'Agregar'}</button>
    </div>`;
}

function leerFilas(wrap) {
  return [...wrap.querySelectorAll('[data-fila]')].map((fila) =>
    Object.fromEntries([...fila.querySelectorAll('[data-col]')].map((el) => [el.dataset.col, el.value])));
}

function filaNueva(wrap) {
  return Object.fromEntries(wrap.dataset.columnas.split(',').map((k) => [k, '']));
}

export function initControlLista(cont, escribir, refrescarPanel) {
  cont.addEventListener('input', (e) => {
    const wrap = e.target.closest('[data-lista]');
    if (!wrap || !e.target.dataset.col) return;
    escribir(wrap.dataset.lista, JSON.stringify(leerFilas(wrap)));
  });

  cont.addEventListener('click', (e) => {
    const wrap = e.target.closest('[data-lista]');
    if (!wrap) return;
    const filas = leerFilas(wrap);
    if (e.target.closest('[data-lista-agregar]')) {
      filas.push(filaNueva(wrap));
    } else {
      const quitar = e.target.closest('[data-lista-quitar]');
      if (!quitar) return;
      filas.splice(Number(quitar.dataset.listaQuitar), 1);
    }
    escribir(wrap.dataset.lista, JSON.stringify(filas));
    refrescarPanel();
  });
}
