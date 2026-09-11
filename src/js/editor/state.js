/*
  state.js
  El modelo de datos del editor: qué bloques hay, cuál está seleccionado,
  el catálogo de tipos de bloque. Sin DOM, sin red — solo datos y las
  funciones puras para leerlos/escribirlos.
*/

import DOMPurify from 'dompurify';

// El bloque "texto" es el único que guarda HTML crudo (contenido.html) en
// vez de texto plano — viene del textarea de propiedades o de la edición
// directa en el lienzo, y el usuario puede escribir ahí lo que quiera.
// Se sanea aquí, en el único punto de escritura de todos los campos, para
// que ningún llamador futuro tenga que acordarse de hacerlo por su cuenta.
const CAMPOS_HTML = new Set(['contenido.html']);
const HTML_PERMITIDO = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'a', 'br', 'p', 'span', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href'],
};

export function sanearHTML(html) {
  return DOMPurify.sanitize(html || '', HTML_PERMITIDO);
}

export const ZONAS = ['encabezado', 'contenido', 'pie'];

export const ETIQUETAS_ZONA = { encabezado: 'Encabezado', contenido: 'Contenido', pie: 'Pie de página' };

export const CONTENEDORES = new Set(['seccion', 'columnas']);

// Set de íconos seleccionables para el bloque "Ícono" — trazos propios,
// no depende de ninguna librería externa. Se insertan como innerHTML de
// un <svg>: son cadenas fijas del código, nunca datos de usuario, así que
// no pasan por sanearHTML (no aplica el mismo riesgo que contenido.html).
export const ICONOS = {
  estrella: '<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z"/>',
  corazon: '<path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/>',
  rayo: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
  casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
  telefono: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.8 2.1z"/>',
  correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  ubicacion: '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
};

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
    nombre: 'Encabezado con título y botón',
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

// Estilos genéricos: aplican a cualquier tipo de bloque (incluidos
// contenedores — la tipografía de una "seccion" cae en cascada sobre sus
// hijos como en CSS normal). Los campos tipo "select" guardan una clave
// legible ('negrita', 'sutil'...), nunca el valor CSS crudo — el mapeo a
// CSS real vive en render.js (estiloInline), así el <select> nunca
// muestra un valor técnico.
export const FUENTES = ['Sora', 'Inter', 'JetBrains Mono', 'Georgia', 'Arial'];
export const PESOS = { normal: '400', medio: '500', semibold: '600', negrita: '700', extra: '800' };
export const ALINEACIONES = { izquierda: 'left', centro: 'center', derecha: 'right' };
export const SOMBRAS = {
  ninguna: '',
  sutil: '0 1px 3px rgba(0,0,0,.12)',
  media: '0 4px 12px rgba(0,0,0,.18)',
  fuerte: '0 8px 24px rgba(0,0,0,.28)',
};

export const CAMPOS_ESTILO = [
  { grupo: 'Color', key: 'estilos.color', label: 'Color de texto', type: 'text', placeholder: '#f2f2f5' },
  { grupo: 'Color', key: 'estilos.fondo', label: 'Fondo', type: 'text', placeholder: 'transparent' },
  { grupo: 'Tipografía', key: 'estilos.fuente', label: 'Fuente', type: 'select', opciones: FUENTES },
  { grupo: 'Tipografía', key: 'estilos.tamano', label: 'Tamaño (px)', type: 'text', placeholder: '16' },
  { grupo: 'Tipografía', key: 'estilos.peso', label: 'Grosor', type: 'select', opciones: Object.keys(PESOS) },
  { grupo: 'Tipografía', key: 'estilos.alineacion', label: 'Alineación', type: 'select', opciones: Object.keys(ALINEACIONES) },
  { grupo: 'Forma', key: 'estilos.borde', label: 'Borde (px)', type: 'text', placeholder: '0' },
  { grupo: 'Forma', key: 'estilos.borde_color', label: 'Color del borde', type: 'text', placeholder: '#e5e5e5' },
  { grupo: 'Forma', key: 'estilos.radio', label: 'Radio de esquinas (px)', type: 'text', placeholder: '0' },
  { grupo: 'Forma', key: 'estilos.sombra', label: 'Sombra', type: 'select', opciones: Object.keys(SOMBRAS) },
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
