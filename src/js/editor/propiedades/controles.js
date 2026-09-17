/*
  controles.js
  Un generador de HTML por tipo de control del panel de propiedades. Todos
  emiten `data-campo="grupo.clave"` para que eventos.js escriba el valor
  en el bloque con actualizarCampo — el panel no sabe nada del estado.
*/

import { leerCampo } from '../state.js';
import { escapeHTML } from '../../render/sanear.js';
import { imagen } from './controles-imagen.js';
import { lista } from './controles-lista.js';

const LADOS = [['arriba', '↑'], ['derecha', '→'], ['abajo', '↓'], ['izquierda', '←']];
const ESQUINAS = [['sup_izq', '↖'], ['sup_der', '↗'], ['inf_der', '↘'], ['inf_izq', '↙']];

function etiqueta(valor) {
  const s = String(valor).replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function textarea(b, c) {
  return `<label>${c.label}</label><textarea data-campo="${c.key}">${escapeHTML(leerCampo(b, c.key))}</textarea>`;
}

function texto(b, c) {
  const ph = c.placeholder ? ` placeholder="${c.placeholder}"` : '';
  return `<label>${c.label}</label><input type="text" data-campo="${c.key}" value="${escapeHTML(leerCampo(b, c.key))}"${ph}>`;
}

function numero(b, c) {
  const attrs = [c.min != null ? `min="${c.min}"` : '', c.max != null ? `max="${c.max}"` : '', c.paso ? `step="${c.paso}"` : '', c.placeholder ? `placeholder="${c.placeholder}"` : ''].filter(Boolean).join(' ');
  return `<label>${c.label}${c.sufijo ? ` <span class="ed-prop-sufijo">${c.sufijo}</span>` : ''}</label><input type="number" data-campo="${c.key}" value="${escapeHTML(leerCampo(b, c.key))}" ${attrs}>`;
}

function select(b, c) {
  const actual = leerCampo(b, c.key);
  const opciones = [...c.opciones];
  if (actual && !opciones.includes(actual)) opciones.unshift(actual);
  const html = opciones.map((o) => `<option value="${o}"${o === actual ? ' selected' : ''}>${c.crudo ? o : etiqueta(o)}</option>`).join('');
  return `<label>${c.label}</label><select data-campo="${c.key}">${html}</select>`;
}

// Picker + hex: el <input type="color"> no puede quedar vacío ("sin color"),
// así que el valor real vive en el campo de texto y el picker solo lo
// alimenta (eventos.js los sincroniza).
function color(b, c) {
  const actual = leerCampo(b, c.key);
  const hex = /^#[0-9a-f]{6}$/i.test(actual) ? actual : '#000000';
  return `<label>${c.label}</label>
    <div class="ed-color">
      <input type="color" value="${hex}" data-color-para="${c.key}" title="Elegir color">
      <input type="text" data-campo="${c.key}" value="${escapeHTML(actual)}" placeholder="${c.placeholder || '#000000'}">
    </div>`;
}

function rango(b, c) {
  const valor = leerCampo(b, c.key) || c.inicial || 0;
  return `<label>${c.label} <span class="ed-prop-sufijo" data-rango-valor="${c.key}">${valor}${c.sufijo || ''}</span></label>
    <input type="range" data-campo="${c.key}" min="${c.min ?? 0}" max="${c.max ?? 100}" step="${c.paso || 1}" value="${valor}">`;
}

function toggle(b, c) {
  const activo = (leerCampo(b, c.key) || c.inicial || '') === 'si';
  return `<label class="ed-toggle"><input type="checkbox" data-campo="${c.key}"${activo ? ' checked' : ''}> ${c.label}</label>`;
}

// 4 lados con un "todos" que escribe los cuatro a la vez (eventos.js).
function lados(b, c) {
  const inputs = LADOS.map(([lado, flecha]) => `
    <span class="ed-lado"><i>${flecha}</i><input type="number" min="0" data-campo="estilos.${c.prefijo}_${lado}" value="${escapeHTML(leerCampo(b, `estilos.${c.prefijo}_${lado}`))}" placeholder="0"></span>`).join('');
  return `<label>${c.label} <span class="ed-prop-sufijo">px</span></label>
    <div class="ed-lados"><span class="ed-lado ed-lado--todos"><i>▣</i><input type="number" min="0" data-campo-todos="${c.prefijo}" placeholder="todos"></span>${inputs}</div>`;
}

// Radio general (estilos.radio) + 4 esquinas opcionales.
function esquinas(b, c) {
  const inputs = ESQUINAS.map(([esq, flecha]) => `
    <span class="ed-lado"><i>${flecha}</i><input type="number" min="0" data-campo="estilos.radio_${esq}" value="${escapeHTML(leerCampo(b, `estilos.radio_${esq}`))}" placeholder="–"></span>`).join('');
  return `<label>${c.label} <span class="ed-prop-sufijo">px</span></label>
    <div class="ed-lados"><span class="ed-lado ed-lado--todos"><i>▣</i><input type="number" min="0" data-campo="estilos.radio" value="${escapeHTML(leerCampo(b, 'estilos.radio'))}" placeholder="0"></span>${inputs}</div>`;
}

// Botones en línea, uno activo, que escriben una sola clave. Cada opción es
// un string o { valor, etiqueta, icono } (icono = paths SVG, para
// "botones_icono"). El clic vive en eventos.js y vuelve a pintar el panel,
// porque suele mostrar u ocultar otros controles.
function segmentado(b, c) {
  const actual = leerCampo(b, c.key) || c.inicial || '';
  const botones = c.opciones.map((o) => {
    const op = typeof o === 'string' ? { valor: o, etiqueta: etiqueta(o) } : o;
    const cuerpo = op.icono
      ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${op.icono}</svg>`
      : op.etiqueta;
    return `<button type="button" data-valor="${op.valor}" class="${op.valor === actual ? 'is-active' : ''}"${op.icono ? ` title="${op.etiqueta}"` : ''}>${cuerpo}</button>`;
  }).join('');
  return `<label>${c.label}</label><div class="ed-segmentado" data-segmento="${c.key}">${botones}</div>`;
}

const CONTROLES = { textarea, text: texto, texto, numero, select, color, rango, toggle, lados, esquinas, segmentado, botones_icono: segmentado, imagen, lista };

// `campo.visible(bloque)` permite que un control dependa de otro (los
// sub-controles del tipo de fondo, la composición solo si es hero).
export function controlHTML(bloque, campo) {
  if (campo.visible && !campo.visible(bloque)) return '';
  const fn = CONTROLES[campo.control || campo.type] || texto;
  return `<div class="ed-prop-campo">${fn(bloque, campo)}</div>`;
}
