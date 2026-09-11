// Cliente del backend: sesión, sitios y bloques.
const BASE = import.meta.env.VITE_API_BASE || 'https://kleysites-api.vercel.app/api';

function token() {
  return localStorage.getItem('kleysites_token');
}

// El JWT no está cifrado, solo firmado — leer el client_id del propio
// token (el del usuario actual) no es un problema de seguridad, evita
// tener que pedírselo al backend solo para nombrar una carpeta de Cloudinary.
export function clienteId() {
  const t = token();
  if (!t) return null;
  try {
    return JSON.parse(atob(t.split('.')[1])).client_id ?? null;
  } catch (e) {
    return null;
  }
}

async function llamar(path, opciones = {}) {
  const res = await fetch(BASE + path, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
      ...(opciones.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Error ${res.status}`);
    err.status = res.status; // así quien llama puede distinguir "límite de plan" (402) de un error cualquiera
    throw err;
  }
  return data;
}

export function crearSitio(nombre) {
  return llamar('/kleysites/sites', { method: 'POST', body: JSON.stringify({ nombre }) });
}

export function listarSitios() {
  return llamar('/kleysites/sites', { method: 'GET' });
}

export function listarPaginas(siteId) {
  return llamar(`/kleysites/pages?site_id=${siteId}`, { method: 'GET' });
}

export function crearPagina(siteId, nombre) {
  return llamar('/kleysites/pages', { method: 'POST', body: JSON.stringify({ site_id: siteId, nombre }) });
}

export function listarBloques(pageId) {
  return llamar(`/kleysites/blocks?page_id=${pageId}`, { method: 'GET' });
}

export function guardarBloque(payload) {
  return llamar('/kleysites/blocks', { method: 'POST', body: JSON.stringify(payload) });
}

export function eliminarBloque(blockId) {
  return llamar(`/kleysites/blocks?block_id=${blockId}`, { method: 'DELETE' });
}

export function renombrarSitio(siteId, nombre) {
  return llamar('/kleysites/sites', { method: 'PATCH', body: JSON.stringify({ site_id: siteId, nombre }) });
}

export function eliminarSitio(siteId) {
  return llamar(`/kleysites/sites?site_id=${siteId}`, { method: 'DELETE' });
}

export function obtenerPerfil() {
  return llamar('/kleysites/perfil', { method: 'GET' });
}

export function guardarAvatarUrl(avatarUrl) {
  return llamar('/kleysites/perfil/avatar', { method: 'POST', body: JSON.stringify({ avatar_url: avatarUrl }) });
}

export function guardarFaviconSitio(siteId, faviconUrl) {
  return llamar('/kleysites/sites/favicon', { method: 'POST', body: JSON.stringify({ site_id: siteId, favicon_url: faviconUrl }) });
}

export function publicarSitio(siteId, pageId) {
  return llamar('/kleysites/publish', { method: 'POST', body: JSON.stringify({ site_id: siteId, page_id: pageId }) });
}
