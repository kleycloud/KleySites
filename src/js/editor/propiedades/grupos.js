/*
  grupos.js
  Grupos de propiedades genéricos (valen para varios tipos de bloque).
  Las etiquetas están escritas en lenguaje simple a propósito — nada de
  jerga de diseño (nada de "radio", "margen", "interlineado" tal cual):
  la web la debe poder usar alguien sin experiencia técnica.
  Cada campo guarda una clave de `estilos`; cómo se vuelve CSS lo decide
  src/js/render/css.js, el único mapeo del producto. Los <select> guardan
  claves legibles (negrita, centro...), nunca valores CSS crudos.
*/

import {
  PESOS, ALINEACIONES, SOMBRAS, TRANSFORMACIONES, DECORACIONES, ESTILOS_BORDE, AJUSTES_FONDO, ANIMACIONES,
} from '../../render/css.js';
import { FUENTES } from '../../render/fuentes.js';

const claves = (obj) => Object.keys(obj);

export const TIPOGRAFIA = {
  id: 'tipografia', titulo: 'Letra',
  campos: [
    { key: 'estilos.fuente', label: 'Tipo de letra', control: 'select', opciones: ['', ...FUENTES], crudo: true },
    { key: 'estilos.tamano', label: 'Tamaño de letra', control: 'numero', sufijo: 'px', min: 1, placeholder: '16' },
    { key: 'estilos.peso', label: 'Grosor de la letra', control: 'select', opciones: ['', ...claves(PESOS)] },
    { key: 'estilos.interlineado', label: 'Espacio entre líneas', control: 'numero', paso: 0.1, min: 0.5, placeholder: '1.5' },
    { key: 'estilos.espaciado_letras', label: 'Espacio entre letras', control: 'numero', sufijo: 'px', paso: 0.5, placeholder: '0' },
    { key: 'estilos.transformacion', label: 'Mayúsculas o minúsculas', control: 'select', opciones: claves(TRANSFORMACIONES) },
    { key: 'estilos.decoracion', label: 'Subrayado o tachado', control: 'select', opciones: claves(DECORACIONES) },
    { key: 'estilos.alineacion', label: 'Alineación del texto', control: 'select', opciones: ['', ...claves(ALINEACIONES)] },
    { key: 'estilos.color', label: 'Color de la letra', control: 'color', placeholder: 'heredado' },
  ],
};

export const FONDO = {
  id: 'fondo', titulo: 'Fondo',
  campos: [
    { key: 'estilos.fondo', label: 'Color de fondo', control: 'color', placeholder: 'transparente' },
    { key: 'estilos.fondo_imagen', label: 'Imagen de fondo', control: 'imagen' },
    { key: 'estilos.fondo_ajuste', label: 'Cómo se acomoda la imagen', control: 'select', opciones: claves(AJUSTES_FONDO) },
  ],
};

// Pestaña "Avanzado": vale para todos los tipos.
export const AVANZADO = {
  id: 'avanzado', titulo: 'Animación de entrada',
  campos: [
    { key: 'estilos.animacion', label: 'Cómo aparece al cargar la página', control: 'select', opciones: claves(ANIMACIONES) },
  ],
};

export const ESPACIADO = {
  id: 'espaciado', titulo: 'Espacio',
  campos: [
    { label: 'Espacio adentro', control: 'lados', prefijo: 'padding' },
    { label: 'Espacio afuera', control: 'lados', prefijo: 'margen' },
  ],
};

export const BORDE = {
  id: 'borde', titulo: 'Bordes y esquinas',
  campos: [
    { key: 'estilos.borde', label: 'Grosor del borde', control: 'numero', sufijo: 'px', min: 0, placeholder: '0' },
    { key: 'estilos.borde_estilo', label: 'Tipo de línea', control: 'select', opciones: claves(ESTILOS_BORDE) },
    { key: 'estilos.borde_color', label: 'Color del borde', control: 'color', placeholder: '#000000' },
    { label: 'Esquinas redondeadas', control: 'esquinas' },
  ],
};

export const EFECTOS = {
  id: 'efectos', titulo: 'Efectos',
  campos: [
    { key: 'estilos.sombra', label: 'Sombra', control: 'select', opciones: claves(SOMBRAS) },
    { key: 'estilos.opacidad', label: 'Transparencia', control: 'rango', min: 0, max: 100, inicial: 100, sufijo: '%' },
  ],
};

export const TAMANO = {
  id: 'tamano', titulo: 'Tamaño',
  campos: [
    { key: 'estilos.ancho', label: 'Ancho', control: 'texto', placeholder: 'auto, 320, 50%' },
    { key: 'estilos.alto', label: 'Alto', control: 'texto', placeholder: 'auto, 240' },
    { key: 'estilos.ancho_max', label: 'Ancho máximo', control: 'texto', placeholder: '1100' },
  ],
};
