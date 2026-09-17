/*
  catalogo/index.js
  Une el catálogo de bloques y deriva de él todo lo que el editor necesita
  (etiquetas, contenido inicial, campos). Categorías del panel, tarjetas
  "Próximamente" y plantillas prearmadas viven acá también.
*/

import { BASICOS } from './basicos.js';
import { AVANZADOS } from './avanzados.js';

export const CATALOGO_BLOQUES = [...BASICOS, ...AVANZADOS];

export const ETIQUETAS = Object.fromEntries(CATALOGO_BLOQUES.map((b) => [b.tipo, b.etiqueta]));
export const CONTENIDO_INICIAL = Object.fromEntries(CATALOGO_BLOQUES.map((b) => [b.tipo, b.contenidoInicial]));
export const CAMPOS = Object.fromEntries(CATALOGO_BLOQUES.map((b) => [b.tipo, b.campos]));

// Orden de las categorías del panel "Bloques".
export const CATEGORIAS = [
  { id: 'basicos', nombre: 'Básicos' },
  { id: 'avanzados', nombre: 'Avanzados' },
  { id: 'ecommerce', nombre: 'Ecommerce' },
  { id: 'extras', nombre: 'Extras' },
];

// Aparecen en el panel deshabilitados con "Próximamente" — NO son tipos
// del catálogo (no se renderizan, no se importan, no se insertan): solo
// paneles.js los mezcla al pintar. Mismo criterio honesto que el panel
// Tienda: se muestra lo que viene, nunca algo que simule funcionar.
export const BLOQUES_PROXIMAMENTE = [
  { tipo: 'carrito', etiqueta: 'Carrito', categoria: 'ecommerce', icono: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>' },
  { tipo: 'checkout', etiqueta: 'Checkout', categoria: 'ecommerce', icono: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>' },
  { tipo: 'lottie', etiqueta: 'Lottie', categoria: 'extras', icono: '<circle cx="12" cy="12" r="9"/><path d="M8 12c1.5-3 2.5-3 4 0s2.5 3 4 0"/>' },
];

// Secciones prearmadas del panel "Plantillas": al insertarse, cada una
// crea una "seccion" contenedora (con `seccion` como contenido y
// `estilos` propios, si los trae) con estos bloques adentro, ya con
// contenido de ejemplo — el usuario edita desde ahí en vez de partir de
// cero. `contenido` es fijo (viene del código, no del usuario), así que
// no necesita pasar por sanearHTML como sí lo hace el campo editable.
export const PLANTILLAS = [
  {
    id: 'hero',
    nombre: 'Hero con título y botón',
    seccion: { tipo_seccion: 'hero' },
    estilos: { altura_min: 'media', contenido_vertical: 'centro', alinear_v: 'centro', alineacion: 'centro' },
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
