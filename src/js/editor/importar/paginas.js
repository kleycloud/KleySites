/*
  paginas.js
  Importación de un proyecto con varias páginas ({ paginas: [...] }): la
  página que coincide con la actual (o la primera) entra al lienzo; las
  demás se crean si no existen y sus bloques se guardan directo en Neon.
*/

import * as api from '../../api.js';
import { state } from '../state.js';
import { ZONAS } from '../../render/arbol.js';
import { getPaginasSitio, asegurarPagina } from '../paginas.js';

async function guardarArbolRemoto(pageId, zona, nodos, parentId, ordenBase) {
  for (const [i, n] of nodos.entries()) {
    const resp = await api.guardarBloque({
      block_id: null, page_id: pageId, tipo: n.tipo, contenido: n.contenido,
      orden: ordenBase + i, zona, parent_id: parentId, estilos: n.estilos || {},
    });
    if (n.hijos && n.hijos.length) await guardarArbolRemoto(pageId, zona, n.hijos, resp.bloque.id, 0);
  }
}

async function guardarPaginaRemota(pagina, zonas) {
  let existentes = [];
  try {
    existentes = (await api.listarBloques(pagina.id)).bloques || [];
  } catch (e) { /* página nueva o sin conexión: se asume vacía */ }
  for (const zona of ZONAS) {
    const nodos = zonas[zona] || [];
    if (!nodos.length) continue;
    const base = existentes.filter((b) => b.zona === zona && b.parent_id == null).length;
    await guardarArbolRemoto(pagina.id, zona, nodos, null, base);
  }
}

// `insertarPorZona` viene de bloques.js (evita el import circular).
export async function importarPaginas(paginas, insertarPorZona) {
  const actual = getPaginasSitio().find((p) => p.id === state.pageId);
  const indiceActual = actual ? paginas.findIndex((p) => p.nombre.toLowerCase() === actual.nombre.toLowerCase()) : -1;
  const paraLienzo = paginas[indiceActual >= 0 ? indiceActual : 0];

  let total = insertarPorZona(paraLienzo.zonas);

  for (const p of paginas) {
    if (p === paraLienzo || !state.siteId) continue;
    try {
      const pagina = await asegurarPagina(p.nombre);
      await guardarPaginaRemota(pagina, p.zonas);
      total += ZONAS.reduce((n, z) => n + (p.zonas[z] || []).length, 0);
    } catch (e) {
      console.error('No se pudo importar la página', p.nombre, e);
    }
  }
  return total;
}
