/*
  state.js
  El modelo de datos del editor: qué bloques hay, cuál está seleccionado,
  el catálogo de tipos de bloque. Sin DOM, sin red — solo datos y las
  funciones puras para leerlos/escribirlos.
*/

export const ZONAS = ['encabezado', 'contenido', 'pie'];

export const ETIQUETAS = {
  texto: 'Texto', titulo: 'Título', imagen: 'Imagen',
  boton: 'Botón', video: 'Video', seccion: 'Sección', columnas: 'Columnas',
};

export const CONTENEDORES = new Set(['seccion', 'columnas']);

export const CONTENIDO_INICIAL = {
  texto: { html: 'Escribe aquí tu texto' },
  titulo: { texto: 'Título', nivel: 'h2' },
  imagen: { src: '', alt: '' },
  boton: { texto: 'Botón', href: '#' },
  video: { src: '' },
  seccion: {},
  columnas: {},
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
};

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
  editandoInline: null, // { id, path, el } — bloque en edición directa (doble clic)
};

export function leerCampo(bloque, path) {
  const [grupo, clave] = path.split('.');
  return (bloque[grupo] && bloque[grupo][clave]) || '';
}

export function escribirCampo(bloque, path, valor) {
  const [grupo, clave] = path.split('.');
  bloque[grupo][clave] = valor;
}
