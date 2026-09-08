/*
  dragdrop.js
  Geometría del arrastrar-y-soltar: solo mide el DOM para decidir dónde
  caería un bloque soltado. No toca `state` — quien llama decide qué
  hacer con el resultado (ver moverBloque en canvas.js).
*/

// El contenedor de destino es el más interno bajo el cursor: una zona
// (`[data-zone-blocks]`, para caer al nivel raíz) o un bloque contenedor
// (`.ed-contenedor`, para anidar dentro). closest() ya prioriza el más
// interno, así que anidar dentro de una sección funciona sin lógica extra.
export function contenedorDestino(el) {
  return el.closest('.ed-contenedor, [data-zone-blocks]');
}

export function datosDestino(contenedorEl, blocks) {
  if (contenedorEl.dataset.zoneBlocks) {
    return { zona: contenedorEl.dataset.zoneBlocks, parentId: null };
  }
  const parentId = Number(contenedorEl.dataset.blockId);
  const padre = blocks.find((b) => b.id === parentId);
  return { zona: padre ? padre.zona : null, parentId };
}

// Compara la posición del cursor contra el punto medio de cada hermano
// (excluyendo el bloque que se arrastra) para encontrar en qué índice caería.
export function indiceDeInsercion(contenedorEl, idArrastrado, clienteX, clienteY, horizontal) {
  const hijos = [...contenedorEl.children].filter(
    (el) => el.matches('.ed-block') && Number(el.dataset.blockId) !== idArrastrado,
  );
  for (let i = 0; i < hijos.length; i++) {
    const r = hijos[i].getBoundingClientRect();
    const medio = horizontal ? r.left + r.width / 2 : r.top + r.height / 2;
    const posicion = horizontal ? clienteX : clienteY;
    if (posicion < medio) return i;
  }
  return hijos.length;
}
