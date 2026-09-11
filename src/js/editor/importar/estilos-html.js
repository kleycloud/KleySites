/*
  estilos-html.js
  Lee los estilos REALES de un HTML importado (clases, <style>, inline)
  y los traduce a claves de `estilos` editables. Para eso el HTML se carga
  en un <iframe sandbox="allow-same-origin"> — sin allow-scripts nada se
  ejecuta, pero sí se puede leer getComputedStyle. Solo se guarda lo que
  difiere del valor por defecto de esa etiqueta o de lo que ya hereda del
  bloque padre, para no llenar cada bloque de ruido.
*/

const ALINEACION = { left: 'izquierda', start: 'izquierda', center: 'centro', right: 'derecha', end: 'derecha', justify: 'justificado' };
const TRANSFORMACION = { uppercase: 'mayusculas', lowercase: 'minusculas', capitalize: 'capitalizar' };
const LADOS = { top: 'arriba', right: 'derecha', bottom: 'abajo', left: 'izquierda' };

function limpiarScripts(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, noscript').forEach((el) => el.remove());
  return `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
}

export function cargarEnIframe(html) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:1200px;height:800px;visibility:hidden';
    iframe.onload = () => resolve({
      doc: iframe.contentDocument,
      win: iframe.contentWindow,
      destruir: () => iframe.remove(),
    });
    iframe.srcdoc = limpiarScripts(html);
    document.body.appendChild(iframe);
  });
}

// Valor por defecto de cada etiqueta: un elemento igual pero dentro de un
// shadow root, donde no llegan las hojas de estilo del documento (solo lo
// heredado) — así una regla global como `h1 { color: red }` sí se detecta.
export function crearContexto(doc, win) {
  const host = doc.createElement('div');
  host.style.cssText = 'position:absolute;visibility:hidden';
  const sombra = host.attachShadow({ mode: 'open' });
  doc.body.appendChild(host);
  const cache = new Map();
  return {
    win,
    porDefecto(tag) {
      if (!cache.has(tag)) {
        const ref = doc.createElement(tag);
        sombra.appendChild(ref);
        cache.set(tag, win.getComputedStyle(ref));
      }
      return cache.get(tag);
    },
  };
}

export function rgbAHex(rgb) {
  const m = String(rgb).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m || (m[4] !== undefined && Number(m[4]) === 0)) return null;
  return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
}

function pesoAClave(w) {
  const n = parseInt(w, 10);
  if (n >= 800) return 'extra';
  if (n >= 700) return 'negrita';
  if (n >= 600) return 'semibold';
  if (n >= 500) return 'medio';
  return 'normal';
}

const num = (v) => Math.round(parseFloat(v) || 0);

function heredados(cs, ref, out) {
  const difiere = (p) => cs.getPropertyValue(p) !== ref.getPropertyValue(p);
  if (difiere('color')) { const hex = rgbAHex(cs.color); if (hex) out.color = hex; }
  if (difiere('font-family')) out.fuente = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
  if (difiere('font-size')) out.tamano = String(num(cs.fontSize));
  if (difiere('font-weight')) out.peso = pesoAClave(cs.fontWeight);
  if (difiere('text-align') && ALINEACION[cs.textAlign]) out.alineacion = ALINEACION[cs.textAlign];
  if (difiere('line-height') && cs.lineHeight !== 'normal') out.interlineado = (parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)).toFixed(2);
  if (difiere('letter-spacing') && cs.letterSpacing !== 'normal') out.espaciado_letras = String(parseFloat(cs.letterSpacing));
  if (difiere('text-transform') && TRANSFORMACION[cs.textTransform]) out.transformacion = TRANSFORMACION[cs.textTransform];
  if (difiere('text-decoration-line') && cs.textDecorationLine.includes('underline')) out.decoracion = 'subrayado';
}

function propios(cs, ref, out) {
  const difiere = (p) => cs.getPropertyValue(p) !== ref.getPropertyValue(p);
  if (difiere('background-color')) { const hex = rgbAHex(cs.backgroundColor); if (hex) out.fondo = hex; }
  Object.entries(LADOS).forEach(([css, lado]) => {
    if (difiere(`padding-${css}`) && num(cs.getPropertyValue(`padding-${css}`)) > 0) out[`padding_${lado}`] = String(num(cs.getPropertyValue(`padding-${css}`)));
    const m = cs.getPropertyValue(`margin-${css}`);
    if (difiere(`margin-${css}`) && m !== 'auto' && num(m) > 0) out[`margen_${lado}`] = String(num(m));
  });
  if (difiere('border-top-left-radius') && num(cs.borderTopLeftRadius) > 0) out.radio = String(num(cs.borderTopLeftRadius));
  if (difiere('border-top-width') && num(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') {
    out.borde = String(num(cs.borderTopWidth));
    const hex = rgbAHex(cs.borderTopColor);
    if (hex) out.borde_color = hex;
  }
  if (difiere('box-shadow') && cs.boxShadow !== 'none') out.sombra = 'media';
  if (difiere('opacity') && parseFloat(cs.opacity) < 1) out.opacidad = String(Math.round(parseFloat(cs.opacity) * 100));
}

// `padreEl`: el elemento del bloque padre (o body para las raíces) — las
// propiedades heredables solo se guardan si cambian respecto a él.
export function extraerEstilos(el, ctx, padreEl) {
  const cs = ctx.win.getComputedStyle(el);
  const ref = ctx.porDefecto(el.tagName.toLowerCase());
  const out = {};
  heredados(cs, padreEl ? ctx.win.getComputedStyle(padreEl) : ref, out);
  propios(cs, ref, out);
  return out;
}

// Lo que el <body> define para toda la página (fuente, color): se copia a
// los bloques raíz, que es donde el editor puede seguir editándolo.
export function estilosDelBody(doc, ctx) {
  const out = {};
  heredados(ctx.win.getComputedStyle(doc.body), ctx.porDefecto('span'), out);
  delete out.tamano;
  return out;
}
