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

export function listarBloques(siteId) {
  return llamar(`/kleysites/blocks?site_id=${siteId}`, { method: 'GET' });
}

export function guardarBloque(payload) {
  return llamar('/kleysites/blocks', { method: 'POST', body: JSON.stringify(payload) });
}

export function eliminarBloque(blockId) {
  return llamar(`/kleysites/blocks?block_id=${blockId}`, { method: 'DELETE' });
}
