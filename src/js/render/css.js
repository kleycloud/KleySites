/*
  css.js
  El ÚNICO mapeo "estilos (jsonb) -> CSS inline" del producto: lo usan el
  lienzo, la vista previa, el ZIP y lo publicado, así que lo que se ve
  editando es exactamente lo que sale. Los <select> guardan claves
  legibles (negrita, centro, sutil) que se resuelven acá; los números
  pelados se asumen en px.
*/

export const PESOS = { normal: '400', medio: '500', semibold: '600', negrita: '700', extra: '800' };
export const ALINEACIONES = { izquierda: 'left', centro: 'center', derecha: 'right', justificado: 'justify' };
export const SOMBRAS = {
  ninguna: '',
  sutil: '0 1px 3px rgba(0,0,0,.12)',
  media: '0 4px 12px rgba(0,0,0,.18)',
  fuerte: '0 8px 24px rgba(0,0,0,.28)',
};
export const TRANSFORMACIONES = { ninguna: 'none', mayusculas: 'uppercase', minusculas: 'lowercase', capitalizar: 'capitalize' };
export const DECORACIONES = { ninguna: 'none', subrayado: 'underline', tachado: 'line-through' };
export const ESTILOS_BORDE = { solido: 'solid', punteado: 'dotted', discontinuo: 'dashed' };
export const AJUSTES_IMAGEN = { cubrir: 'cover', contener: 'contain', rellenar: 'fill' };
export const AJUSTES_FONDO = { cubrir: 'cover', contener: 'contain', repetir: 'auto' };
export const DIRECCIONES = { fila: 'row', columna: 'column' };
export const ALINEAR_H = { inicio: 'flex-start', centro: 'center', fin: 'flex-end', espaciado: 'space-between' };
export const ALINEAR_V = { inicio: 'flex-start', centro: 'center', fin: 'flex-end', estirar: 'stretch' };
export const PROPORCIONES = { auto: '', '16:9': '16 / 9', '4:3': '4 / 3', '1:1': '1 / 1' };
export const ALTURAS = { auto: '', media: '50vh', pantalla: '100vh' };
export const VERTICALES = { inicio: 'flex-start', centro: 'center', fin: 'flex-end' };
// Nombres de @keyframes: viven en canvas.css (lienzo) y en CSS_BASE de
// documento.js (publicado), los dos con la misma definición.
export const ANIMACIONES = { ninguna: '', aparecer: 'kley-aparecer', subir: 'kley-subir', bajar: 'kley-bajar', crecer: 'kley-crecer' };

const LADOS = ['arriba', 'derecha', 'abajo', 'izquierda'];
const LADOS_CSS = ['top', 'right', 'bottom', 'left'];
const ESQUINAS = ['radio_sup_izq', 'radio_sup_der', 'radio_inf_der', 'radio_inf_izq'];

function px(v) {
  const s = String(v).trim();
  return /^-?\d+(\.\d+)?$/.test(s) ? `${s}px` : s;
}

function vacio(v) {
  return v === undefined || v === null || String(v).trim() === '';
}

function tipografia(e, out) {
  if (e.color) out.push(`color:${e.color}`);
  if (e.fuente) out.push(`font-family:'${e.fuente}',sans-serif`);
  if (!vacio(e.tamano)) out.push(`font-size:${px(e.tamano)}`);
  if (PESOS[e.peso]) out.push(`font-weight:${PESOS[e.peso]}`);
  if (!vacio(e.interlineado)) out.push(`line-height:${e.interlineado}`);
  if (!vacio(e.espaciado_letras)) out.push(`letter-spacing:${px(e.espaciado_letras)}`);
  if (TRANSFORMACIONES[e.transformacion] && e.transformacion !== 'ninguna') out.push(`text-transform:${TRANSFORMACIONES[e.transformacion]}`);
  if (DECORACIONES[e.decoracion] && e.decoracion !== 'ninguna') out.push(`text-decoration:${DECORACIONES[e.decoracion]}`);
  if (ALINEACIONES[e.alineacion]) out.push(`text-align:${ALINEACIONES[e.alineacion]}`);
}

// `fondo_tipo` (color|imagen|video) decide qué se ve; el color queda
// siempre como base debajo de la imagen o el video. El video no es CSS:
// lo pinta capasFondoHTML (bloques.js) como capa absoluta.
function fondo(e, out) {
  if (e.fondo) out.push(`background-color:${e.fondo}`);
  const imagenActiva = e.fondo_imagen && (!e.fondo_tipo || e.fondo_tipo === 'imagen');
  if (imagenActiva) {
    // Comillas simples: el CSS termina dentro de style="…" (comillas dobles).
    out.push(`background-image:url('${e.fondo_imagen.replace(/['"()]/g, '')}')`, 'background-position:center');
    const ajuste = AJUSTES_FONDO[e.fondo_ajuste] || 'cover';
    out.push(`background-size:${ajuste}`, `background-repeat:${e.fondo_ajuste === 'repetir' ? 'repeat' : 'no-repeat'}`);
  }
}

function espaciado(e, out) {
  LADOS.forEach((lado, i) => {
    if (!vacio(e[`padding_${lado}`])) out.push(`padding-${LADOS_CSS[i]}:${px(e[`padding_${lado}`])}`);
    if (!vacio(e[`margen_${lado}`])) out.push(`margin-${LADOS_CSS[i]}:${px(e[`margen_${lado}`])}`);
  });
}

function borde(e, out, tipo) {
  if (!vacio(e.borde) && Number(e.borde) > 0) {
    const lado = tipo === 'separador' ? 'border-top' : 'border';
    out.push(`${lado}-style:${ESTILOS_BORDE[e.borde_estilo] || 'solid'}`, `${lado}-width:${px(e.borde)}`, `${lado}-color:${e.borde_color || '#000'}`);
  }
  if (!vacio(e.radio)) out.push(`border-radius:${px(e.radio)}`);
  const esquinas = ESQUINAS.map((k) => e[k]);
  if (esquinas.some((v) => !vacio(v))) {
    const base = vacio(e.radio) ? '0' : px(e.radio);
    out.push(`border-radius:${esquinas.map((v) => (vacio(v) ? base : px(v))).join(' ')}`);
  }
}

function efectos(e, out) {
  if (SOMBRAS[e.sombra]) out.push(`box-shadow:${SOMBRAS[e.sombra]}`);
  if (!vacio(e.opacidad) && Number(e.opacidad) < 100) out.push(`opacity:${Number(e.opacidad) / 100}`);
  const filtros = [];
  if (!vacio(e.filtro_brillo) && Number(e.filtro_brillo) !== 100) filtros.push(`brightness(${e.filtro_brillo}%)`);
  if (!vacio(e.filtro_contraste) && Number(e.filtro_contraste) !== 100) filtros.push(`contrast(${e.filtro_contraste}%)`);
  if (!vacio(e.filtro_gris) && Number(e.filtro_gris) > 0) filtros.push(`grayscale(${e.filtro_gris}%)`);
  if (!vacio(e.filtro_desenfoque) && Number(e.filtro_desenfoque) > 0) filtros.push(`blur(${px(e.filtro_desenfoque)})`);
  if (filtros.length) out.push(`filter:${filtros.join(' ')}`);
  if (ANIMACIONES[e.animacion]) out.push(`animation:${ANIMACIONES[e.animacion]} .6s ease both`);
}

function tamano(e, out) {
  if (!vacio(e.ancho)) out.push(`width:${px(e.ancho)}`);
  if (!vacio(e.alto)) out.push(`height:${px(e.alto)}`);
  if (!vacio(e.ancho_max)) out.push(`max-width:${px(e.ancho_max)}`);
  if (AJUSTES_IMAGEN[e.ajuste]) out.push(`object-fit:${AJUSTES_IMAGEN[e.ajuste]}`);
  if (PROPORCIONES[e.proporcion]) out.push(`aspect-ratio:${PROPORCIONES[e.proporcion]}`);
  if (e.ancho_completo === 'si') out.push('display:block', 'width:100%', 'text-align:center');
}

// Solo para contenedores (seccion/columnas) y galería: cómo se acomodan
// los hijos. `columnas_n` pasa el contenedor a grid con N columnas.
function layout(e, out, tipo) {
  if (tipo === 'galeria') {
    if (!vacio(e.galeria_columnas)) out.push(`grid-template-columns:repeat(${Number(e.galeria_columnas)},1fr)`);
    if (!vacio(e.galeria_gap)) out.push(`gap:${px(e.galeria_gap)}`);
    if (!vacio(e.galeria_alto)) out.push(`--galeria-alto:${px(e.galeria_alto)}`);
    return;
  }
  if (!vacio(e.columnas_n) && Number(e.columnas_n) > 0) {
    out.push('display:grid', `grid-template-columns:repeat(${Number(e.columnas_n)},1fr)`);
  } else if (DIRECCIONES[e.direccion]) {
    out.push('display:flex', `flex-direction:${DIRECCIONES[e.direccion]}`);
  }
  if (!vacio(e.gap)) out.push(`gap:${px(e.gap)}`);
  if (ALINEAR_H[e.alinear_h]) out.push(`justify-content:${ALINEAR_H[e.alinear_h]}`);
  if (ALINEAR_V[e.alinear_v]) out.push(`align-items:${ALINEAR_V[e.alinear_v]}`);
  if (ALTURAS[e.altura_min]) out.push(`min-height:${ALTURAS[e.altura_min]}`);
  // Solo tiene sentido apilado en columna: en fila o en grilla se ignora.
  const enColumna = vacio(e.columnas_n) && e.direccion !== 'fila';
  if (enColumna && VERTICALES[e.contenido_vertical]) {
    out.push('display:flex', 'flex-direction:column', `justify-content:${VERTICALES[e.contenido_vertical]}`);
  }
}

export function estilosACSS(estilos, tipo) {
  const e = estilos || {};
  const out = [];
  tipografia(e, out);
  fondo(e, out);
  espaciado(e, out);
  borde(e, out, tipo);
  efectos(e, out);
  tamano(e, out);
  layout(e, out, tipo);
  return out.join(';');
}
