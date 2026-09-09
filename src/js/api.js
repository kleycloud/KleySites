// Cliente de los webhooks de n8n: sesión, sitios y bloques.
const BASE = 'https://kleyderproject.cloud/webhook';

function token() {
  return localStorage.getItem('kleysites_token');
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
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
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
