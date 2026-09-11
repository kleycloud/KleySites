/*
  grupos.js
  Grupos de propiedades genéricos (valen para varios tipos de bloque).
  Cada campo guarda una clave de `estilos`; cómo se vuelve CSS lo decide
  src/js/render/css.js, el único mapeo del producto. Los <select> guardan
  claves legibles (negrita, centro...), nunca valores CSS crudos.
*/

import {
  PESOS, ALINEACIONES, SOMBRAS, TRANSFORMACIONES, DECORACIONES, ESTILOS_BORDE, AJUSTES_FONDO,
} from '../../render/css.js';
import { FUENTES } from '../../render/fuentes.js';

const claves = (obj) => Object.keys(obj);

export const TIPOGRAFIA = {
  id: 'tipografia', titulo: 'Tipografía',
  campos: [
    { key: 'estilos.fuente', label: 'Fuente', control: 'select', opciones: ['', ...FUENTES], crudo: true },
    { key: 'estilos.tamano', label: 'Tamaño', control: 'numero', sufijo: 'px', min: 1, placeholder: '16' },
    { key: 'estilos.peso', label: 'Grosor', control: 'select', opciones: ['', ...claves(PESOS)] },
    { key: 'estilos.interlineado', label: 'Interlineado', control: 'numero', paso: 0.1, min: 0.5, placeholder: '1.5' },
    { key: 'estilos.espaciado_letras', label: 'Espaciado entre letras', control: 'numero', sufijo: 'px', paso: 0.5, placeholder: '0' },
    { key: 'estilos.transformacion', label: 'Mayúsculas / minúsculas', control: 'select', opciones: claves(TRANSFORMACIONES) },
    { key: 'estilos.decoracion', label: 'Decoración', control: 'select', opciones: claves(DECORACIONES) },
    { key: 'estilos.alineacion', label: 'Alineación', control: 'select', opciones: ['', ...claves(ALINEACIONES)] },
    { key: 'estilos.color', label: 'Color de texto', control: 'color', placeholder: 'heredado' },
  ],
};

export const FONDO = {
  id: 'fondo', titulo: 'Fondo',
  campos: [
    { key: 'estilos.fondo', label: 'Color de fondo', control: 'color', placeholder: 'transparente' },
    { key: 'estilos.fondo_imagen', label: 'Imagen de fondo (URL)', control: 'texto', placeholder: 'https://…' },
    { key: 'estilos.fondo_ajuste', label: 'Ajuste de la imagen', control: 'select', opciones: claves(AJUSTES_FONDO) },
  ],
};

export const ESPACIADO = {
  id: 'espaciado', titulo: 'Espaciado',
  campos: [
    { label: 'Relleno interior', control: 'lados', prefijo: 'padding' },
    { label: 'Margen exterior', control: 'lados', prefijo: 'margen' },
  ],
};

export const BORDE = {
  id: 'borde', titulo: 'Borde y esquinas',
  campos: [
    { key: 'estilos.borde', label: 'Grosor del borde', control: 'numero', sufijo: 'px', min: 0, placeholder: '0' },
    { key: 'estilos.borde_estilo', label: 'Estilo', control: 'select', opciones: claves(ESTILOS_BORDE) },
    { key: 'estilos.borde_color', label: 'Color del borde', control: 'color', placeholder: '#000000' },
    { label: 'Radio de esquinas', control: 'esquinas' },
  ],
};

export const EFECTOS = {
  id: 'efectos', titulo: 'Efectos',
  campos: [
    { key: 'estilos.sombra', label: 'Sombra', control: 'select', opciones: claves(SOMBRAS) },
    { key: 'estilos.opacidad', label: 'Opacidad', control: 'rango', min: 0, max: 100, inicial: 100, sufijo: '%' },
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
