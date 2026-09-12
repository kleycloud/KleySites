// Nombre para mostrar (saludo del dashboard, campo de Perfil): el real si
// el cliente ya lo puso, si no uno derivado del correo (antes de la @,
// sin números, con mayúscula inicial). Devuelve null si no hay nada de
// donde sacarlo (sin nombre y sin correo) — quien llama decide el saludo
// genérico para ese caso, esto no inventa una palabra suelta.
export function nombreODeMail(nombre, email) {
  if (nombre) return nombre;
  const local = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim();
  return local ? local.replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}
