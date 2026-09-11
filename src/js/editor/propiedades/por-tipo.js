/*
  por-tipo.js
  Grupos de propiedades específicos de un tipo de bloque, y qué grupos
  (genéricos + específicos) ve cada tipo — texto no muestra "Imagen",
  imagen no muestra "Tipografía", etc.
*/

import {
  AJUSTES_IMAGEN, DIRECCIONES, ALINEAR_H, ALINEAR_V, PROPORCIONES, ESTILOS_BORDE,
} from '../../render/css.js';
import { TIPOGRAFIA, FONDO, ESPACIADO, BORDE, EFECTOS, TAMANO } from './grupos.js';

const claves = (obj) => Object.keys(obj);

const IMAGEN = {
  id: 'imagen', titulo: 'Imagen',
  campos: [
    { key: 'estilos.ajuste', label: 'Ajuste', control: 'select', opciones: ['', ...claves(AJUSTES_IMAGEN)] },
    { key: 'estilos.filtro_brillo', label: 'Brillo', control: 'rango', min: 0, max: 200, inicial: 100, sufijo: '%' },
    { key: 'estilos.filtro_contraste', label: 'Contraste', control: 'rango', min: 0, max: 200, inicial: 100, sufijo: '%' },
    { key: 'estilos.filtro_gris', label: 'Escala de grises', control: 'rango', min: 0, max: 100, inicial: 0, sufijo: '%' },
    { key: 'estilos.filtro_desenfoque', label: 'Desenfoque', control: 'rango', min: 0, max: 20, inicial: 0, sufijo: 'px' },
  ],
};

const BOTON = {
  id: 'boton', titulo: 'Botón',
  campos: [
    { key: 'estilos.ancho_completo', label: 'Ocupar todo el ancho', control: 'toggle' },
  ],
};

const CONTENEDOR = {
  id: 'contenedor', titulo: 'Distribución',
  campos: [
    { key: 'estilos.direccion', label: 'Dirección', control: 'select', opciones: ['', ...claves(DIRECCIONES)] },
    { key: 'estilos.columnas_n', label: 'Columnas iguales', control: 'numero', min: 0, max: 6, placeholder: '0 = automático' },
    { key: 'estilos.gap', label: 'Separación entre bloques', control: 'numero', sufijo: 'px', min: 0, placeholder: '16' },
    { key: 'estilos.alinear_h', label: 'Alineación horizontal', control: 'select', opciones: ['', ...claves(ALINEAR_H)] },
    { key: 'estilos.alinear_v', label: 'Alineación vertical', control: 'select', opciones: ['', ...claves(ALINEAR_V)] },
  ],
};

const GALERIA = {
  id: 'galeria', titulo: 'Galería',
  campos: [
    { key: 'estilos.galeria_columnas', label: 'Columnas', control: 'numero', min: 1, max: 6, placeholder: 'automático' },
    { key: 'estilos.galeria_gap', label: 'Separación', control: 'numero', sufijo: 'px', min: 0, placeholder: '8' },
    { key: 'estilos.galeria_alto', label: 'Alto de cada imagen', control: 'numero', sufijo: 'px', min: 40, placeholder: '160' },
  ],
};

const ICONO = {
  id: 'icono', titulo: 'Ícono',
  campos: [{ key: 'estilos.color', label: 'Color', control: 'color', placeholder: 'heredado' }],
};

const SEPARADOR = {
  id: 'separador', titulo: 'Línea',
  campos: [
    { key: 'estilos.borde', label: 'Grosor', control: 'numero', sufijo: 'px', min: 1, placeholder: '2' },
    { key: 'estilos.borde_estilo', label: 'Estilo', control: 'select', opciones: claves(ESTILOS_BORDE) },
    { key: 'estilos.borde_color', label: 'Color', control: 'color', placeholder: '#dddddd' },
  ],
};

const MEDIOS = {
  id: 'medios', titulo: 'Proporción',
  campos: [{ key: 'estilos.proporcion', label: 'Proporción', control: 'select', opciones: claves(PROPORCIONES) }],
};

const GRUPOS_POR_TIPO = {
  texto: [TIPOGRAFIA, FONDO, ESPACIADO, BORDE, EFECTOS, TAMANO],
  titulo: [TIPOGRAFIA, FONDO, ESPACIADO, BORDE, EFECTOS, TAMANO],
  boton: [TIPOGRAFIA, BOTON, FONDO, ESPACIADO, BORDE, EFECTOS, TAMANO],
  imagen: [IMAGEN, TAMANO, ESPACIADO, BORDE, EFECTOS],
  video: [MEDIOS, TAMANO, ESPACIADO, BORDE, EFECTOS],
  mapa: [MEDIOS, TAMANO, ESPACIADO, BORDE, EFECTOS],
  icono: [ICONO, ESPACIADO, EFECTOS],
  separador: [SEPARADOR, ESPACIADO, EFECTOS],
  espaciador: [FONDO],
  galeria: [GALERIA, ESPACIADO, BORDE, EFECTOS, TAMANO],
  formulario: [TIPOGRAFIA, FONDO, ESPACIADO, BORDE, EFECTOS, TAMANO],
  seccion: [CONTENEDOR, FONDO, ESPACIADO, BORDE, EFECTOS, TAMANO, TIPOGRAFIA],
  columnas: [CONTENEDOR, FONDO, ESPACIADO, BORDE, EFECTOS, TAMANO, TIPOGRAFIA],
};

export function gruposParaTipo(tipo) {
  return GRUPOS_POR_TIPO[tipo] || [FONDO, ESPACIADO, BORDE, EFECTOS, TAMANO];
}

// Todas las claves de `estilos` que el producto conoce — el importador
// descarta cualquier otra.
export function clavesDeEstiloConocidas() {
  const claves = new Set();
  Object.values(GRUPOS_POR_TIPO).flat().forEach((g) => g.campos.forEach((c) => {
    if (c.key) claves.add(c.key.replace('estilos.', ''));
    if (c.control === 'lados') ['arriba', 'derecha', 'abajo', 'izquierda'].forEach((l) => claves.add(`${c.prefijo}_${l}`));
    if (c.control === 'esquinas') ['radio', 'radio_sup_izq', 'radio_sup_der', 'radio_inf_der', 'radio_inf_izq'].forEach((k) => claves.add(k));
  }));
  return claves;
}
