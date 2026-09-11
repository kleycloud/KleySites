// Estado vacío de cada zona del lienzo: ícono, nombre y qué se espera
// que vaya ahí. El color lo pone canvas.css vía --zone-color (azul /
// morado / naranja, tokens --zone-* en kley-tokens.css).
export const ZONAS_UI = {
  encabezado: {
    nombre: 'Encabezado',
    descripcion: 'Añade tu logo, menú y elementos principales',
    icono: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M4 17l5-5 4 4 3-2 4 4"/>',
  },
  contenido: {
    nombre: 'Contenido',
    descripcion: 'Escribe o empieza a dar vida a tu página o sitio web',
    icono: '<path d="M4 6h16M4 10h16M4 14h16M4 18h10"/>',
  },
  pie: {
    nombre: 'Pie de página',
    descripcion: 'Incluye tu información legal, datos de contacto y enlaces de navegación',
    icono: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><rect x="8" y="14" width="8" height="4" rx="1"/>',
  },
};

export function zonaVaciaHTML(zona) {
  const z = ZONAS_UI[zona];
  return `
    <div class="ed-zone-empty">
      <div class="icon-frame icon-frame--24">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${z.icono}</svg>
      </div>
      <p class="ed-zone-empty-nombre">${z.nombre}</p>
      <p class="ed-zone-empty-text">${z.descripcion}</p>
    </div>`;
}
