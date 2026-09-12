/*
  sitios.js
  Las tarjetas de "Mis sitios": miniatura (real si ya se publicó al menos
  una vez con la captura de editor/miniatura.js; si no, un bloque de
  color con la inicial — nunca una imagen inventada), estado
  Publicado/Borrador, y páginas + fecha de creación reales. Mismas clases
  (`db-card`, `db-card-nombre`, `db-card-slug`) que ya usan los tests —
  el rediseño es visual, no cambia esos contratos.
*/

function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function fechaCorta(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function miniatura(sitio) {
  if (sitio.thumbnail_url) return `<img src="${escapeHTML(sitio.thumbnail_url)}" alt="">`;
  return escapeHTML(sitio.nombre || '?')[0].toUpperCase();
}

export function tarjetaSitio(sitio) {
  const publicado = Boolean(sitio.published_at);
  const paginas = sitio.paginas_count ?? 0;
  return `
    <a class="db-card" href="/editor.html?site=${sitio.id}">
      <div class="db-card-miniatura">
        ${miniatura(sitio)}
        <span class="db-card-badge" data-estado="${publicado ? 'publicado' : 'borrador'}">${publicado ? 'Publicado' : 'Borrador'}</span>
      </div>
      <div class="db-card-cuerpo">
        <div class="db-card-nombre">${escapeHTML(sitio.nombre)}</div>
        <div class="db-card-slug">${escapeHTML(sitio.slug)}</div>
        <div class="db-card-meta">
          <span>${paginas} ${paginas === 1 ? 'página' : 'páginas'}</span>
          <span>Creado ${fechaCorta(sitio.created_at)}</span>
        </div>
      </div>
    </a>`;
}

export function tarjetaCrear() {
  return `
    <div class="db-card db-card--crear" id="tarjetaCrear">
      <div class="icon-frame icon-frame--24">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16M4 12h16"/></svg>
      </div>
      <div class="db-card-nombre">Crear sitio nuevo</div>
    </div>`;
}

export function estadoVacio() {
  return `
    <div class="db-empty">
      <div class="icon-frame icon-frame--36">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
      </div>
      <p class="db-empty-text">Aún no tienes sitios. Crea el primero para empezar a diseñar.</p>
    </div>`;
}
