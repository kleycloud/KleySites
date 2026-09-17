// Helpers puros sobre la lista plana de bloques ({ id, parent_id, zona,
// orden }). Sirven igual con ids locales del editor o ids remotos de Neon:
// solo importa que `parent_id` apunte al `id` del mismo conjunto.
export const ZONAS = ['encabezado', 'hero', 'contenido', 'pie'];

export function ordenar(lista) {
  return [...lista].sort((a, z) => (a.orden || 0) - (z.orden || 0));
}

export function hijosDe(bloques, parentId) {
  return ordenar(bloques.filter((b) => b.parent_id === parentId));
}

export function raicesDeZona(bloques, zona) {
  return ordenar(bloques.filter((b) => b.zona === zona && b.parent_id == null));
}

// Una sección "hero" puede apagar partes de sí misma con los interruptores
// mostrar_*. El rol de cada hijo se deduce de su tipo (sin metadatos
// nuevos), y apagar solo OCULTA: el hijo sigue en el árbol con sus
// ediciones. Un interruptor ausente cuenta como encendido; solo 'no'
// apaga.
const INTERRUPTOR_POR_TIPO = { titulo: 'mostrar_titulo', texto: 'mostrar_descripcion', boton: 'mostrar_botones' };

export function esHero(b) {
  return !!b && b.tipo === 'seccion' && (b.contenido || {}).tipo_seccion === 'hero';
}

export function hijoOculto(padre, hijo) {
  if (!esHero(padre)) return false;
  const clave = INTERRUPTOR_POR_TIPO[hijo.tipo];
  return !!clave && padre.contenido[clave] === 'no';
}

export function hijosVisibles(bloques, padre) {
  return hijosDe(bloques, padre.id).filter((h) => !hijoOculto(padre, h));
}

// Lista plana -> árbol anidado [{ tipo, contenido, estilos, hijos? }] por
// zona. Es el formato KleySites v1 (docs/formato-kleysites.md).
function nodoDe(bloques, b) {
  const nodo = { tipo: b.tipo, contenido: b.contenido || {} };
  if (b.estilos && Object.keys(b.estilos).length) nodo.estilos = b.estilos;
  const hijos = hijosDe(bloques, b.id).map((h) => nodoDe(bloques, h));
  if (hijos.length) nodo.hijos = hijos;
  return nodo;
}

export function aArbolPorZona(bloques) {
  const zonas = {};
  ZONAS.forEach((zona) => { zonas[zona] = raicesDeZona(bloques, zona).map((b) => nodoDe(bloques, b)); });
  return zonas;
}
