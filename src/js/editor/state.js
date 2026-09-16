/*
  state.js
  El modelo de datos del editor: qué bloques hay, cuál está seleccionado,
  el catálogo de tipos de bloque. Sin DOM, sin red — solo datos y las
  funciones puras para leerlos/escribirlos.
*/

import { sanearHTML } from '../render/sanear.js';
import { ICONOS } from '../render/iconos.js';
import { ZONAS } from '../render/arbol.js';

export { sanearHTML, ICONOS, ZONAS };

// El bloque "texto" es el único que guarda HTML crudo (contenido.html) —
// se sanea aquí, en el único punto de escritura de todos los campos, para
// que ningún llamador futuro tenga que acordarse de hacerlo por su cuenta.
const CAMPOS_HTML = new Set(['contenido.html']);

export const ETIQUETAS_ZONA = { encabezado: 'Header', hero: 'Hero', contenido: 'Contenido', pie: 'Footer' };

export const CONTENEDORES = new Set(['seccion', 'columnas']);

// Fuente de verdad única por tipo de bloque: etiqueta, ícono (panel
// "Bloques", generado por paneles.js — mismo criterio que ICONOS arriba,
// cadenas fijas del código), forma inicial de `contenido`, y campos
// editables en el panel de propiedades. Agregar un tipo de bloque nuevo
// es agregar UNA entrada acá, nunca tocar editor.html.
export const CATALOGO_BLOQUES = [
  {
    tipo: 'imagen', etiqueta: 'Imagen',
    icono: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M4 17l5-5 4 4 3-2 4 4"/>',
    contenidoInicial: { src: '', alt: '' },
    campos: [
      { key: 'contenido.src', label: 'Imagen (URL)', type: 'text' },
      { key: 'contenido.alt', label: 'Texto alternativo', type: 'text' },
    ],
  },
  {
    tipo: 'titulo', etiqueta: 'Título',
    icono: '<path d="M6 4v16M18 4v16M6 12h12"/>',
    contenidoInicial: { texto: 'Título', nivel: 'h2' },
    campos: [
      { key: 'contenido.texto', label: 'Texto', type: 'text' },
      { key: 'contenido.nivel', label: 'Nivel', type: 'select', opciones: ['h1', 'h2', 'h3', 'h4'] },
    ],
  },
  {
    tipo: 'texto', etiqueta: 'Texto',
    icono: '<path d="M5 6h14M12 6v13M9 19h6"/>',
    contenidoInicial: { html: 'Escribe aquí tu texto' },
    campos: [{ key: 'contenido.html', label: 'Texto', type: 'textarea' }],
  },
  {
    tipo: 'boton', etiqueta: 'Botón',
    icono: '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M8 12h8"/>',
    contenidoInicial: { texto: 'Botón', href: '#' },
    campos: [
      { key: 'contenido.texto', label: 'Texto del botón', type: 'text' },
      { key: 'contenido.href', label: 'Enlace', type: 'text' },
    ],
  },
  {
    tipo: 'seccion', etiqueta: 'Sección',
    icono: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/>',
    contenidoInicial: {},
    campos: [],
  },
  {
    tipo: 'columnas', etiqueta: 'Columnas',
    icono: '<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>',
    contenidoInicial: {},
    campos: [],
  },
  {
    tipo: 'video', etiqueta: 'Video',
    icono: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    contenidoInicial: { src: '' },
    campos: [{ key: 'contenido.src', label: 'Video (URL)', type: 'text' }],
  },
  {
    tipo: 'icono', etiqueta: 'Ícono',
    icono: '<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z"/>',
    contenidoInicial: { nombre: 'estrella', tamano: '32' },
    campos: [
      { key: 'contenido.nombre', label: 'Ícono', type: 'select', opciones: Object.keys(ICONOS) },
      { key: 'contenido.tamano', label: 'Tamaño (px)', type: 'text' },
    ],
  },
  {
    tipo: 'separador', etiqueta: 'Separador',
    icono: '<path d="M4 12h16"/>',
    contenidoInicial: {},
    campos: [],
  },
  {
    tipo: 'espaciador', etiqueta: 'Espaciador',
    icono: '<path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>',
    contenidoInicial: { alto: '40' },
    campos: [{ key: 'contenido.alto', label: 'Alto (px)', type: 'text' }],
  },
  {
    tipo: 'galeria', etiqueta: 'Galería',
    icono: '<rect x="3" y="3" width="12" height="12" rx="2"/><rect x="9" y="9" width="12" height="12" rx="2"/>',
    contenidoInicial: { imagenes: '' },
    campos: [{ key: 'contenido.imagenes', label: 'Imágenes (una URL por línea)', type: 'textarea' }],
  },
  {
    tipo: 'formulario', etiqueta: 'Formulario',
    icono: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/>',
    contenidoInicial: { titulo: 'Contáctanos', boton: 'Enviar' },
    campos: [
      { key: 'contenido.titulo', label: 'Título', type: 'text' },
      { key: 'contenido.boton', label: 'Texto del botón', type: 'text' },
    ],
  },
  {
    tipo: 'mapa', etiqueta: 'Mapa',
    icono: '<path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16M15 5v16"/>',
    contenidoInicial: { src: '' },
    campos: [{ key: 'contenido.src', label: 'Mapa (URL de inserción de Google Maps)', type: 'text' }],
  },
];

export const ETIQUETAS = Object.fromEntries(CATALOGO_BLOQUES.map((b) => [b.tipo, b.etiqueta]));
export const CONTENIDO_INICIAL = Object.fromEntries(CATALOGO_BLOQUES.map((b) => [b.tipo, b.contenidoInicial]));
export const CAMPOS = Object.fromEntries(CATALOGO_BLOQUES.map((b) => [b.tipo, b.campos]));

// Secciones prearmadas del panel "Plantillas": al insertarse, cada una
// crea una "seccion" contenedora con estos bloques adentro, ya con
// contenido de ejemplo — el usuario edita desde ahí en vez de partir de
// cero. `contenido` es fijo (viene del código, no del usuario), así que
// no necesita pasar por sanearHTML como sí lo hace el campo editable.
export const PLANTILLAS = [
  {
    id: 'hero',
    nombre: 'Hero con título y botón',
    hijos: [
      { tipo: 'titulo', contenido: { texto: 'Bienvenido a tu sitio', nivel: 'h1' } },
      { tipo: 'texto', contenido: { html: 'Cuéntale a tus visitantes de qué se trata en una frase.' } },
      { tipo: 'boton', contenido: { texto: 'Empezar', href: '#' } },
    ],
  },
  {
    id: 'contacto',
    nombre: 'Sección de contacto',
    hijos: [
      { tipo: 'titulo', contenido: { texto: 'Hablemos', nivel: 'h2' } },
      { tipo: 'formulario', contenido: { titulo: 'Contáctanos', boton: 'Enviar' } },
    ],
  },
  {
    id: 'galeria',
    nombre: 'Galería con título',
    hijos: [
      { tipo: 'titulo', contenido: { texto: 'Nuestro trabajo', nivel: 'h2' } },
      { tipo: 'galeria', contenido: { imagenes: '' } },
    ],
  },
];

// Estado del lienzo en memoria, sincronizado con Neon. `id` es el
// identificador local (estable durante toda la sesión, para anidar y
// seleccionar); `remoteId` es el id real en la tabla `blocks` una vez que
// ese bloque ya se guardó al menos una vez. Un solo objeto exportado para
// que todos los módulos del editor compartan la misma referencia mutable.
export const state = {
  nextId: 1,
  blocks: [],
  selectedId: null,
  zonaActiva: 'contenido', // dónde cae lo próximo que se inserte desde el panel
  siteId: null,
  pageId: null,
  editandoInline: null, // { id, path, el } — bloque en edición directa (doble clic)
};

export function leerCampo(bloque, path) {
  const [grupo, clave] = path.split('.');
  return (bloque[grupo] && bloque[grupo][clave]) || '';
}

export function escribirCampo(bloque, path, valor) {
  const [grupo, clave] = path.split('.');
  bloque[grupo][clave] = CAMPOS_HTML.has(path) ? sanearHTML(valor) : valor;
}
