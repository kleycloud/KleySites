/*
  json.js
  Formato KleySites v1 (docs/formato-kleysites.md). Acepta:
    - un array de nodos            -> va a la zona activa
    - { zonas: { encabezado, contenido, pie } }  -> una página
    - { paginas: [{ nombre, zonas }] }           -> varias páginas
  Cada nodo: { tipo, contenido, estilos?, hijos? }. Un tipo fuera del
  catálogo se descarta entero; una clave de estilo desconocida se ignora.
*/

import { sanearHTML, ETIQUETAS } from '../state.js';
import { ZONAS } from '../../render/arbol.js';
import { clavesDeEstiloConocidas } from '../propiedades/por-tipo.js';

const TIPOS_VALIDOS = new Set(Object.keys(ETIQUETAS));
const CLAVES_ESTILO = clavesDeEstiloConocidas();

export class ErrorImportacion extends Error {
  constructor(motivo) {
    super(motivo);
    this.motivo = motivo;
  }
}

export function sanearEstilos(estilos) {
  const out = {};
  if (!estilos || typeof estilos !== 'object') return out;
  Object.entries(estilos).forEach(([k, v]) => {
    if (CLAVES_ESTILO.has(k) && (typeof v === 'string' || typeof v === 'number')) out[k] = String(v);
  });
  return out;
}

function sanearNodo(n) {
  if (!n || typeof n !== 'object' || !TIPOS_VALIDOS.has(n.tipo)) return null;
  const contenido = { ...(n.contenido || {}) };
  if (n.tipo === 'texto' && typeof contenido.html === 'string') contenido.html = sanearHTML(contenido.html);
  const nodo = { tipo: n.tipo, contenido, estilos: sanearEstilos(n.estilos) };
  if (Array.isArray(n.hijos)) {
    const hijos = n.hijos.map(sanearNodo).filter(Boolean);
    if (hijos.length) nodo.hijos = hijos;
  }
  return nodo;
}

function sanearLista(lista) {
  return Array.isArray(lista) ? lista.map(sanearNodo).filter(Boolean) : [];
}

function zonasDe(z) {
  const out = {};
  ZONAS.forEach((zona) => { out[zona] = sanearLista(z && z[zona]); });
  return out;
}

export function analizarJSON(texto) {
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch (e) {
    throw new ErrorImportacion('json_invalido');
  }
  if (Array.isArray(datos)) return { activa: sanearLista(datos) };
  if (datos && Array.isArray(datos.paginas)) {
    return { paginas: datos.paginas.map((p, i) => ({ nombre: String(p.nombre || `Página ${i + 1}`), zonas: zonasDe(p.zonas) })) };
  }
  if (datos && datos.zonas && typeof datos.zonas === 'object') return zonasDe(datos.zonas);
  if (datos && datos.tipo) return { activa: sanearLista([datos]) };
  throw new ErrorImportacion('json_invalido');
}
