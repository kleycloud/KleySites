import DOMPurify from 'dompurify';

// El bloque "texto" es el único que guarda HTML crudo (contenido.html):
// viene del textarea de propiedades, de la edición directa en el lienzo o
// de una importación, y el usuario puede escribir ahí lo que quiera.
const HTML_PERMITIDO = {
  ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'a', 'br', 'p', 'span', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href'],
};

export function sanearHTML(html) {
  return DOMPurify.sanitize(html || '', HTML_PERMITIDO);
}

export function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
