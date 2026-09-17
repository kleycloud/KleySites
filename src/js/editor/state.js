/*
  state.js
  El modelo de datos del editor: qué bloques hay, cuál está seleccionado,
  y las funciones puras para leer/escribir sus campos. Sin DOM, sin red.
  El catálogo de tipos vive en catalogo/ y se reexporta desde acá para
  que todo el editor lo importe de un solo lugar.
*/

import { sanearHTML, sanearHTMLAmplio } from '../render/sanear.js';
import { ICONOS } from '../render/iconos.js';
import { ZONAS } from '../render/arbol.js';

export { sanearHTML, ICONOS, ZONAS };
export {
  CATALOGO_BLOQUES, ETIQUETAS, CONTENIDO_INICIAL, CAMPOS, CATEGORIAS, BLOQUES_PROXIMAMENTE, PLANTILLAS,
} from './catalogo/index.js';

// Solo dos bloques guardan HTML crudo, cada uno con su saneador: "texto"
// (etiquetas de texto enriquecido) y "Código HTML" (estructura amplia,
// nunca scripts). Se aplica acá, en el único punto de escritura de todos
// los campos (panel, edición directa, importación), para que ningún
// llamador tenga que acordarse.
const SANEADORES = {
  'texto:contenido.html': sanearHTML,
  'html:contenido.html': sanearHTMLAmplio,
};

export const ETIQUETAS_ZONA = { encabezado: 'Header', hero: 'Hero', contenido: 'Contenido', pie: 'Footer' };

export const CONTENEDORES = new Set(['seccion', 'columnas']);

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
  const sanear = SANEADORES[`${bloque.tipo}:${path}`];
  bloque[grupo][clave] = sanear ? sanear(valor) : valor;
}
