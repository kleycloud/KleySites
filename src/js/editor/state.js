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

export const ETIQUETAS = {
  texto: 'Texto', titulo: 'Título', imagen: 'Imagen',
  boton: 'Botón', video: 'Video', seccion: 'Sección', columnas: 'Columnas',
  icono: 'Ícono', separador: 'Separador', espaciador: 'Espaciador',
  galeria: 'Galería', formulario: 'Formulario', mapa: 'Mapa',
};

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

export const CONTENIDO_INICIAL = {
  texto: { html: 'Escribe aquí tu texto' },
  titulo: { texto: 'Título', nivel: 'h2' },
  imagen: { src: '', alt: '' },
  boton: { texto: 'Botón', href: '#' },
  video: { src: '' },
  seccion: {},
  columnas: {},
  icono: { nombre: 'estrella', tamano: '32' },
  separador: {},
  espaciador: { alto: '40' },
  galeria: { imagenes: '' },
  formulario: { titulo: 'Contáctanos', boton: 'Enviar' },
  mapa: { src: '' },
};

export const CAMPOS = {
  texto: [{ key: 'contenido.html', label: 'Texto', type: 'textarea' }],
  titulo: [
    { key: 'contenido.texto', label: 'Texto', type: 'text' },
    { key: 'contenido.nivel', label: 'Nivel', type: 'select', opciones: ['h1', 'h2', 'h3', 'h4'] },
  ],
  imagen: [
    { key: 'contenido.src', label: 'Imagen (URL)', type: 'text' },
    { key: 'contenido.alt', label: 'Texto alternativo', type: 'text' },
  ],
  boton: [
    { key: 'contenido.texto', label: 'Texto del botón', type: 'text' },
    { key: 'contenido.href', label: 'Enlace', type: 'text' },
  ],
  video: [{ key: 'contenido.src', label: 'Video (URL)', type: 'text' }],
  seccion: [],
  columnas: [],
  icono: [
    { key: 'contenido.nombre', label: 'Ícono', type: 'select', opciones: Object.keys(ICONOS) },
    { key: 'contenido.tamano', label: 'Tamaño (px)', type: 'text' },
  ],
  separador: [],
  espaciador: [{ key: 'contenido.alto', label: 'Alto (px)', type: 'text' }],
  galeria: [{ key: 'contenido.imagenes', label: 'Imágenes (una URL por línea)', type: 'textarea' }],
  formulario: [
    { key: 'contenido.titulo', label: 'Título', type: 'text' },
    { key: 'contenido.boton', label: 'Texto del botón', type: 'text' },
  ],
  mapa: [{ key: 'contenido.src', label: 'Mapa (URL de inserción de Google Maps)', type: 'text' }],
};

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
