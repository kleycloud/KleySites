// Renderizador de bloques a HTML: registro de tipo -> función, árbol vía
// parent_id, y estilos jsonb traducidos a CSS inline. Agregar un tipo de
// bloque nuevo = agregar una entrada acá.
const MAPA_ESTILOS = {
  color: 'color', fondo: 'background', fuente: 'font-family',
  tamano: 'font-size', peso: 'font-weight', espaciado: 'padding',
  alineacion: 'text-align', radio: 'border-radius', ancho: 'width',
};

function estiloInline(estilos) {
  return Object.entries(estilos || {})
    .filter(([k]) => MAPA_ESTILOS[k])
    .map(([k, v]) => `${MAPA_ESTILOS[k]}:${v}`)
    .join(';');
}

const RENDERERS = {
  texto: (c, s) => `<div style="${s}">${c.html || ''}</div>`,
  titulo: (c, s) => { const n = c.nivel || 'h2'; return `<${n} style="${s}">${c.texto || ''}</${n}>`; },
  imagen: (c, s) => `<img src="${c.src || ''}" alt="${c.alt || ''}" style="${s}">`,
  boton: (c, s) => `<a href="${c.href || '#'}" style="${s}">${c.texto || 'Botón'}</a>`,
  icono: (c, s) => `<span style="${s}">${c.nombre || ''}</span>`,
  separador: (c, s) => `<hr style="${s}">`,
  espaciador: (c, s) => `<div style="height:${c.alto || '24px'};${s}"></div>`,
  video: (c, s) => `<video src="${c.src || ''}" controls style="${s}"></video>`,
  seccion: (c, s, hijos) => `<section style="${s}">${hijos}</section>`,
  columnas: (c, s, hijos) => `<div style="display:flex;gap:16px;${s}">${hijos}</div>`,
};

function renderBloque(b, porPadre) {
  const s = estiloInline(b.estilos);
  const hijos = (porPadre[b.id] || [])
    .sort((a, z) => (a.orden || 0) - (z.orden || 0))
    .map((h) => renderBloque(h, porPadre))
    .join('\n');
  const render = RENDERERS[b.tipo];
  if (!render) return `<!-- tipo sin renderizador todavía: ${b.tipo} -->`;
  return render(b.contenido, s, hijos);
}

export function renderizarPagina(filas, titulo) {
  const bloques = filas.map((b) => ({
    ...b,
    contenido: typeof b.contenido === 'string' ? JSON.parse(b.contenido) : (b.contenido || {}),
    estilos: typeof b.estilos === 'string' ? JSON.parse(b.estilos) : (b.estilos || {}),
  }));

  const porPadre = {};
  bloques.forEach((b) => {
    if (b.parent_id != null) (porPadre[b.parent_id] = porPadre[b.parent_id] || []).push(b);
  });

  const raices = bloques.filter((b) => b.parent_id == null);
  const porZona = { encabezado: [], contenido: [], pie: [] };
  raices.forEach((b) => (porZona[b.zona] || porZona.contenido).push(b));

  const renderZona = (lista) =>
    lista.sort((a, z) => (a.orden || 0) - (z.orden || 0)).map((b) => renderBloque(b, porPadre)).join('\n');

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${titulo || 'Mi sitio KleySites'}</title></head><body>
<header>${renderZona(porZona.encabezado)}</header>
<main>${renderZona(porZona.contenido)}</main>
<footer>${renderZona(porZona.pie)}</footer>
</body></html>`;
}
