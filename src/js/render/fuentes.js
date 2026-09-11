// Familias tipográficas que ofrece el panel de propiedades. Las de Google
// Fonts se cargan bajo demanda (solo las usadas) en el HTML publicado; las
// "de sistema" no necesitan <link>.
export const FUENTES_GOOGLE = [
  'Sora', 'Inter', 'Poppins', 'Montserrat', 'Roboto', 'Lato', 'Nunito',
  'Playfair Display', 'Merriweather', 'Lora', 'JetBrains Mono',
];
export const FUENTES_SISTEMA = ['Georgia', 'Arial', 'Verdana', 'Times New Roman', 'Courier New'];
export const FUENTES = [...FUENTES_GOOGLE, ...FUENTES_SISTEMA];

export function urlGoogleFonts(familias) {
  const usadas = [...new Set(familias)].filter((f) => FUENTES_GOOGLE.includes(f));
  if (!usadas.length) return null;
  const query = usadas.map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

export function fuentesUsadas(bloques) {
  return bloques.map((b) => b.estilos && b.estilos.fuente).filter(Boolean);
}
