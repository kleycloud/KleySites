// CORS y el catch-all de errores ahora son middleware global de Hono
// (ver index.js) — esto solo queda como atajo para las respuestas de
// error 4xx, que cada ruta sigue devolviendo con su propio mensaje.
export function error(c, status, mensaje) {
  return c.json({ error: mensaje }, status);
}
