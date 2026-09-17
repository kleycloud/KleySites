/*
  catalogo/basicos.js
  Bloques de la categoría "Básicos". Cada entrada es la fuente de verdad
  única de su tipo: etiqueta, ícono del panel (cadena fija del código),
  forma inicial de `contenido` y campos de la pestaña Contenido. Agregar
  un tipo = agregar UNA entrada acá (o en avanzados.js) y su renderer.
*/

import { ICONOS } from '../../render/iconos.js';
import { AJUSTES_FONDO, ALTURAS, VERTICALES } from '../../render/css.js';

// Composición de una sección tipo "hero" (pestaña Contenido). Son claves
// de `estilos` mostradas junto al contenido porque para el usuario son
// "qué tiene el hero", no "cómo se ve": fondo, altura, qué se muestra.
const esHero = (b) => (b.contenido || {}).tipo_seccion === 'hero';
const fondoEs = (tipo) => (b) => esHero(b) && ((b.estilos || {}).fondo_tipo || 'color') === tipo;
const conMedio = (b) => esHero(b) && ['imagen', 'video'].includes((b.estilos || {}).fondo_tipo);
const ICONOS_VERTICAL = {
  inicio: '<path d="M4 4h16"/><rect x="8" y="8" width="8" height="12" rx="1"/>',
  centro: '<path d="M4 12h4M16 12h4"/><rect x="8" y="6" width="8" height="12" rx="1"/>',
  fin: '<path d="M4 20h16"/><rect x="8" y="4" width="8" height="12" rx="1"/>',
};
const CAMPOS_SECCION = [
  { key: 'contenido.tipo_seccion', label: 'Tipo de sección', control: 'segmentado', inicial: 'libre', opciones: [{ valor: 'libre', etiqueta: 'Libre' }, { valor: 'hero', etiqueta: 'Hero' }] },
  { key: 'estilos.fondo_tipo', label: 'Fondo', control: 'segmentado', inicial: 'color', opciones: ['color', 'imagen', 'video'], visible: esHero },
  { key: 'estilos.fondo', label: 'Color de fondo', control: 'color', placeholder: 'transparente', visible: fondoEs('color') },
  { key: 'estilos.fondo_imagen', label: 'Imagen de fondo', control: 'imagen', visible: fondoEs('imagen') },
  { key: 'estilos.fondo_ajuste', label: 'Cómo se acomoda la imagen', control: 'select', opciones: Object.keys(AJUSTES_FONDO), visible: fondoEs('imagen') },
  { key: 'estilos.fondo_video', label: 'Video de fondo (URL .mp4)', control: 'texto', placeholder: 'https://…', visible: fondoEs('video') },
  { key: 'estilos.overlay', label: 'Oscurecer el fondo', control: 'rango', min: 0, max: 100, inicial: 0, sufijo: '%', visible: conMedio },
  { key: 'estilos.altura_min', label: 'Altura', control: 'segmentado', inicial: 'auto', opciones: Object.keys(ALTURAS), visible: esHero },
  { key: 'estilos.contenido_vertical', label: 'Contenido alineado', control: 'botones_icono', inicial: 'inicio', opciones: Object.keys(VERTICALES).map((v) => ({ valor: v, etiqueta: v.charAt(0).toUpperCase() + v.slice(1), icono: ICONOS_VERTICAL[v] })), visible: esHero },
  { key: 'contenido.mostrar_titulo', label: 'Mostrar título', control: 'toggle', inicial: 'si', visible: esHero },
  { key: 'contenido.mostrar_descripcion', label: 'Mostrar descripción', control: 'toggle', inicial: 'si', visible: esHero },
  { key: 'contenido.mostrar_botones', label: 'Mostrar botones', control: 'toggle', inicial: 'si', visible: esHero },
];

export const BASICOS = [
  {
    tipo: 'imagen', etiqueta: 'Imagen', categoria: 'basicos',
    icono: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M4 17l5-5 4 4 3-2 4 4"/>',
    contenidoInicial: { src: '', alt: '' },
    campos: [
      { key: 'contenido.src', label: 'Imagen', control: 'imagen' },
      { key: 'contenido.alt', label: 'Texto alternativo', type: 'text' },
    ],
  },
  {
    tipo: 'titulo', etiqueta: 'Título', categoria: 'basicos',
    icono: '<path d="M6 4v16M18 4v16M6 12h12"/>',
    contenidoInicial: { texto: 'Título', nivel: 'h2' },
    campos: [
      { key: 'contenido.texto', label: 'Texto', type: 'text' },
      { key: 'contenido.nivel', label: 'Nivel', type: 'select', opciones: ['h1', 'h2', 'h3', 'h4'] },
    ],
  },
  {
    tipo: 'texto', etiqueta: 'Texto', categoria: 'basicos',
    icono: '<path d="M5 6h14M12 6v13M9 19h6"/>',
    contenidoInicial: { html: 'Escribe aquí tu texto' },
    campos: [{ key: 'contenido.html', label: 'Texto', type: 'textarea' }],
  },
  {
    tipo: 'boton', etiqueta: 'Botón', categoria: 'basicos',
    icono: '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M8 12h8"/>',
    contenidoInicial: { texto: 'Botón', href: '#' },
    campos: [
      { key: 'contenido.texto', label: 'Texto del botón', type: 'text' },
      { key: 'contenido.href', label: 'Enlace', type: 'text' },
    ],
  },
  {
    tipo: 'seccion', etiqueta: 'Sección', categoria: 'basicos',
    icono: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/>',
    contenidoInicial: {},
    campos: CAMPOS_SECCION,
  },
  {
    tipo: 'columnas', etiqueta: 'Columnas', categoria: 'basicos',
    icono: '<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="16" rx="2"/>',
    contenidoInicial: {},
    campos: [],
  },
  {
    tipo: 'video', etiqueta: 'Video', categoria: 'basicos',
    icono: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    contenidoInicial: { src: '' },
    campos: [{ key: 'contenido.src', label: 'Video (URL)', type: 'text' }],
  },
  {
    tipo: 'icono', etiqueta: 'Ícono', categoria: 'basicos',
    icono: '<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z"/>',
    contenidoInicial: { nombre: 'estrella', tamano: '32' },
    campos: [
      { key: 'contenido.nombre', label: 'Ícono', type: 'select', opciones: Object.keys(ICONOS) },
      { key: 'contenido.tamano', label: 'Tamaño (px)', type: 'text' },
    ],
  },
  {
    tipo: 'separador', etiqueta: 'Separador', categoria: 'basicos',
    icono: '<path d="M4 12h16"/>',
    contenidoInicial: {},
    campos: [],
  },
  {
    tipo: 'espaciador', etiqueta: 'Espaciador', categoria: 'basicos',
    icono: '<path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>',
    contenidoInicial: { alto: '40' },
    campos: [{ key: 'contenido.alto', label: 'Alto (px)', type: 'text' }],
  },
];
