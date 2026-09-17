/*
  lista.js
  Los bloques con filas repetidas (FAQ, características de un precio,
  redes sociales) guardan sus filas como un string JSON en una sola clave
  de `contenido`, para que el modelo siga siendo "strings por clave" y
  viaje igual por Neon, el ZIP y el importador. Este es el único lugar que
  sabe leerlo: cualquier valor raro devuelve una lista vacía, nunca rompe.
*/

export function parsearLista(valor) {
  if (Array.isArray(valor)) return valor.filter((f) => f && typeof f === 'object');
  if (typeof valor !== 'string' || !valor.trim()) return [];
  try {
    const datos = JSON.parse(valor);
    return Array.isArray(datos) ? datos.filter((f) => f && typeof f === 'object') : [];
  } catch {
    return [];
  }
}
