/*
  sidebar.js
  El dashboard es una sola página — "Inicio"/"Mis sitios"/"Plantillas" no
  navegan a ninguna URL, hacen scroll suave hasta su sección. También el
  buscador de la topbar, que solo filtra "Mis sitios" (lo único que tiene
  sentido buscar hoy).
*/

export function initSidebar() {
  const botones = document.querySelectorAll('.db-sidebar-item[data-ir]');
  botones.forEach((btn) => {
    btn.addEventListener('click', () => {
      const destino = document.getElementById(btn.dataset.ir);
      destino?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      botones.forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });
}

export function initBuscador(grid) {
  const input = document.getElementById('inputBuscarSitios');
  if (!input || !grid) return;

  input.addEventListener('input', () => {
    const texto = input.value.trim().toLowerCase();
    grid.querySelectorAll('.db-card').forEach((card) => {
      if (card.id === 'tarjetaCrear') return; // siempre visible
      const nombre = card.querySelector('.db-card-nombre')?.textContent.toLowerCase() || '';
      card.hidden = texto.length > 0 && !nombre.includes(texto);
    });
  });
}
