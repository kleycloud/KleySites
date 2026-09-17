import DOMPurify from 'dompurify';

// El bloque "texto" guarda HTML crudo (contenido.html): viene del textarea
// de propiedades, de la edición directa en el lienzo o de una
// importación, y el usuario puede escribir ahí lo que quiera.
const HTML_PERMITIDO = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'a', 'br', 'p', 'span', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href'],
};

// El bloque "Código HTML" acepta más estructura (encabezados, imágenes,
// tablas, estilos inline), pero NUNCA nada que ejecute o cargue código:
// script, iframe, object, embed, form, style, ni atributos on*. DOMPurify
// ya quita on* y los href/src "javascript:" por defecto.
const HTML_AMPLIO = {
  ALLOWED_TAGS: [
    ...HTML_PERMITIDO.ALLOWED_TAGS,
    'div', 'section', 'article', 'header', 'footer', 'nav', 'aside',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'figure', 'figcaption', 'blockquote', 'hr',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'small', 'sub', 'sup', 'code', 'pre', 'mark',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 'target', 'rel', 'colspan', 'rowspan'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'style', 'link', 'meta', 'base', 'svg', 'math'],
};

export function sanearHTML(html) {
  return DOMPurify.sanitize(html || '', HTML_PERMITIDO);
}

export function sanearHTMLAmplio(html) {
  return DOMPurify.sanitize(html || '', HTML_AMPLIO);
}

export function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Un enlace escrito por el usuario solo puede ser web, correo, teléfono,
// ancla o ruta relativa; cualquier otro esquema (javascript:, data:) cae a '#'.
export function hrefSeguro(href) {
  const h = String(href ?? '').trim();
  if (!h) return '#';
  if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(h)) return escapeHTML(h);
  if (!/^[a-z][a-z0-9+.-]*:/i.test(h)) return escapeHTML(h); // relativo sin esquema (contacto.html)
  return '#';
}
