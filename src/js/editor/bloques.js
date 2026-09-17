/*
  bloques.js
  Las acciones que mutan el árbol de bloques: crear, seleccionar, mover,
  eliminar, editar campos, deshacer/rehacer. El verbo común a todas:
  tocan `state.blocks` y dejan todo listo para re-render + autoguardado.
*/

import * as api from '../api.js';
import { state, ZONAS, CONTENEDORES, CONTENIDO_INICIAL, PLANTILLAS, escribirCampo } from './state.js';
import { guardarSnapshot, registrarEdicionDebounced, deshacer as deshacerHistorial, rehacer as rehacerHistorial } from './history.js';
import { programarGuardado } from './sync.js';
import { renderCanvas, renderPropiedades, actualizarEstadosVisuales } from './render.js';
import { analizarJSON } from './importar/json.js';
import { analizarHTML } from './importar/html.js';
import { importarPaginas } from './importar/paginas.js';

export function deshacer() {
  if (!deshacerHistorial()) return;
  renderCanvas();
  renderPropiedades();
  programarGuardado();
}

export function rehacer() {
  if (!rehacerHistorial()) return;
  renderCanvas();
  renderPropiedades();
  programarGuardado();
}

export function crearBloque(tipo) {
  guardarSnapshot();

  const seleccionado = state.blocks.find((b) => b.id === state.selectedId);
  const enContenedor = seleccionado && CONTENEDORES.has(seleccionado.tipo) && seleccionado.zona === state.zonaActiva;
  const parentId = enContenedor ? seleccionado.id : null;
  const zona = state.zonaActiva;
  const hermanos = state.blocks.filter((b) => b.parent_id === parentId && b.zona === zona);

  state.blocks.push({
    id: state.nextId++,
    remoteId: null,
    tipo,
    contenido: structuredClone(CONTENIDO_INICIAL[tipo] || {}),
    estilos: {},
    zona,
    parent_id: parentId,
    orden: hermanos.length,
  });
  state.selectedId = state.blocks[state.blocks.length - 1].id;
  renderCanvas();
  renderPropiedades();
  programarGuardado();
}

// Inserta un árbol de bloques ({ tipo, contenido, estilos?, hijos? }) ya
// armado — lo comparten las plantillas (contenido fijo del código) y la
// importación de HTML/JSON (contenido ajeno, ya saneado en importar/).
function insertarArbol(nodos, zona, parentId, ordenInicial = 0) {
  nodos.forEach((n, i) => {
    const bloque = {
      id: state.nextId++,
      remoteId: null,
      tipo: n.tipo,
      contenido: structuredClone(n.contenido || {}),
      estilos: { ...(n.estilos || {}) },
      zona,
      parent_id: parentId,
      orden: ordenInicial + i,
    };
    state.blocks.push(bloque);
    if (n.hijos && n.hijos.length) insertarArbol(n.hijos, zona, bloque.id);
  });
}

// { encabezado?, contenido?, pie?, activa? } -> cada lista se agrega al
// final de su zona ("activa" = la zona activa). Devuelve cuántos bloques
// raíz se insertaron.
function insertarPorZona(porZona) {
  const listas = ZONAS.map((zona) => [zona, porZona[zona] || []]);
  if (porZona.activa && porZona.activa.length) listas.push([state.zonaActiva, porZona.activa]);
  const total = listas.reduce((n, [, lista]) => n + lista.length, 0);
  if (!total) return 0;

  guardarSnapshot();
  listas.forEach(([zona, lista]) => {
    if (!lista.length) return;
    const base = state.blocks.filter((b) => b.parent_id === null && b.zona === zona).length;
    insertarArbol(lista, zona, null, base);
  });
  renderCanvas();
  renderPropiedades();
  programarGuardado();
  return total;
}

export function insertarPlantilla(id) {
  const plantilla = PLANTILLAS.find((p) => p.id === id);
  if (!plantilla) return;

  guardarSnapshot();
  const zona = state.zonaActiva;
  const hermanos = state.blocks.filter((b) => b.parent_id === null && b.zona === zona);
  const seccion = {
    id: state.nextId++, remoteId: null, tipo: 'seccion',
    contenido: { ...(plantilla.seccion || {}) }, estilos: { ...(plantilla.estilos || {}) },
    zona, parent_id: null, orden: hermanos.length,
  };
  state.blocks.push(seccion);
  insertarArbol(plantilla.hijos, zona, seccion.id);

  state.selectedId = seccion.id;
  renderCanvas();
  renderPropiedades();
  programarGuardado();
}

// Devuelve cuántos bloques se importaron (0 = nada que convertir). Un
// JSON malformado lanza ErrorImportacion en vez de caer al heurístico
// de HTML, que solo produciría basura.
export async function importarContenido(texto) {
  const t = texto.trim();
  if (t.startsWith('[') || t.startsWith('{')) {
    const datos = analizarJSON(t);
    if (datos.paginas) return importarPaginas(datos.paginas, insertarPorZona);
    return insertarPorZona(datos);
  }
  return insertarPorZona(await analizarHTML(t));
}

export function seleccionarBloque(id) {
  const bloque = state.blocks.find((b) => b.id === id);
  if (bloque) state.zonaActiva = bloque.zona;
  state.selectedId = id;
  actualizarEstadosVisuales();
  renderPropiedades();
}

export function activarZona(zona) {
  state.zonaActiva = zona;
  state.selectedId = null;
  actualizarEstadosVisuales();
  renderPropiedades();
}

export function deseleccionar() {
  state.selectedId = null;
  actualizarEstadosVisuales();
  renderPropiedades();
}

export function eliminarBloqueSeleccionado() {
  if (state.selectedId == null) return;
  guardarSnapshot();
  const aEliminar = new Set([state.selectedId]);
  let cambio = true;
  while (cambio) {
    cambio = false;
    state.blocks.forEach((b) => {
      if (b.parent_id != null && aEliminar.has(b.parent_id) && !aEliminar.has(b.id)) {
        aEliminar.add(b.id);
        cambio = true;
      }
    });
  }
  const remotosAEliminar = state.blocks
    .filter((b) => aEliminar.has(b.id) && b.remoteId != null)
    .map((b) => b.remoteId);

  state.blocks = state.blocks.filter((b) => !aEliminar.has(b.id));
  state.selectedId = null;
  renderCanvas();
  renderPropiedades();

  remotosAEliminar.forEach((remoteId) => {
    api.eliminarBloque(remoteId).catch((e) => console.error('No se pudo eliminar en Neon', remoteId, e));
  });
}

// true si moverlo a nuevoParentId lo metería dentro de sí mismo o de uno
// de sus propios descendientes (una sección arrastrada sobre su propio hijo).
export function formaCiclo(idArrastrado, nuevoParentId) {
  if (nuevoParentId == null) return false;
  let actual = state.blocks.find((b) => b.id === nuevoParentId);
  while (actual) {
    if (actual.id === idArrastrado) return true;
    actual = actual.parent_id == null ? null : state.blocks.find((b) => b.id === actual.parent_id);
  }
  return false;
}

export function moverBloque(idArrastrado, zonaDestino, parentIdDestino, indiceDestino) {
  const bloque = state.blocks.find((b) => b.id === idArrastrado);
  if (!bloque || zonaDestino == null) return;
  if (idArrastrado === parentIdDestino || formaCiclo(idArrastrado, parentIdDestino)) return;
  if (bloque.zona === zonaDestino && bloque.parent_id === parentIdDestino) {
    // Reordenar dentro del mismo grupo: si ya está justo en ese índice, no
    // hay nada que hacer (evita un snapshot de deshacer vacío).
    const hermanos = state.blocks
      .filter((b) => b.zona === zonaDestino && b.parent_id === parentIdDestino)
      .sort((a, z) => a.orden - z.orden);
    if (hermanos[indiceDestino] === bloque) return;
  }

  guardarSnapshot();

  const hermanosViejos = state.blocks
    .filter((b) => b.id !== idArrastrado && b.zona === bloque.zona && b.parent_id === bloque.parent_id)
    .sort((a, z) => a.orden - z.orden);
  hermanosViejos.forEach((b, i) => { b.orden = i; });

  bloque.zona = zonaDestino;
  bloque.parent_id = parentIdDestino;

  const hermanosNuevos = state.blocks
    .filter((b) => b.id !== idArrastrado && b.zona === zonaDestino && b.parent_id === parentIdDestino)
    .sort((a, z) => a.orden - z.orden);
  hermanosNuevos.splice(Math.min(indiceDestino, hermanosNuevos.length), 0, bloque);
  hermanosNuevos.forEach((b, i) => { b.orden = i; });

  renderCanvas();
  renderPropiedades();
  programarGuardado();
}

export function actualizarCampo(id, path, valor) {
  const bloque = state.blocks.find((b) => b.id === id);
  if (!bloque) return;

  registrarEdicionDebounced();
  escribirCampo(bloque, path, valor);
  renderCanvas();
  programarGuardado();
}
