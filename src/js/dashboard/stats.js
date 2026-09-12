/*
  stats.js
  La fila de 4 estadísticas — todas calculadas de datos reales que ya se
  tienen (la misma respuesta de listarSitios() más el plan), nunca
  inventadas. Sigue el contrato "stat tile" de la skill dataviz: label en
  oración sin dos puntos, valor grande, delta con color solo cuando es
  una buena noticia. Sin gráfico (ver nota en stats.css).
*/

const ICONOS = {
  sitios: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/>',
  paginas: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  publicados: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>',
  plan: '<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z"/>',
};

function esteMes(fechaISO) {
  const f = new Date(fechaISO);
  const hoy = new Date();
  return f.getFullYear() === hoy.getFullYear() && f.getMonth() === hoy.getMonth();
}

export function calcularStats(sitios, plan) {
  const creadosEsteMes = sitios.filter((s) => esteMes(s.created_at)).length;
  return {
    sitiosCreados: sitios.length,
    sitiosCreadosDelta: creadosEsteMes ? `+${creadosEsteMes} este mes` : '',
    paginasTotales: sitios.reduce((n, s) => n + (s.paginas_count || 0), 0),
    sitiosPublicados: sitios.filter((s) => s.published_at).length,
    plan: plan === 'pro' ? 'Pro' : 'Gratis',
  };
}

function tarjeta({ icono, label, valor, delta, tono }) {
  return `
    <div class="db-stat-card"${tono ? ` data-tono="${tono}"` : ''}>
      <div class="db-stat-icono">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${icono}</svg>
      </div>
      <div class="db-stat-cuerpo">
        <p class="db-stat-label">${label}</p>
        <p class="db-stat-valor">${valor}</p>
        ${delta ? `<span class="db-stat-delta" data-signo="positivo">${delta}</span>` : ''}
      </div>
    </div>`;
}

export function renderStats(cont, stats) {
  cont.innerHTML = [
    tarjeta({ icono: ICONOS.sitios, label: 'Sitios creados', valor: stats.sitiosCreados, delta: stats.sitiosCreadosDelta }),
    tarjeta({ icono: ICONOS.paginas, label: 'Páginas totales', valor: stats.paginasTotales }),
    tarjeta({ icono: ICONOS.publicados, label: 'Sitios publicados', valor: stats.sitiosPublicados }),
    tarjeta({ icono: ICONOS.plan, label: 'Plan actual', valor: stats.plan, tono: 'marca' }),
  ].join('');
}
