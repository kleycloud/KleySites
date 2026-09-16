/*
  seo.js
  robots.txt y sitemap.xml del sitio publicado — para que Google pueda
  encontrarlo e indexarlo bien. Necesitan URLs absolutas (así lo exige
  el estándar de sitemaps), así que asumen el dominio que da Publicar
  (`<slug>.pages.dev`). Si el sitio se exportó y se sube a otro hosting,
  hay que editar el dominio adentro de estos dos archivos a mano — se
  avisa en LEEME.txt.
*/

export function generarRobotsTxt(dominio) {
  return `User-agent: *
Allow: /

Sitemap: ${dominio}/sitemap.xml
`;
}

export function generarSitemapXml(dominio, paginas) {
  const urls = paginas
    .map((p) => `  <url>
    <loc>${dominio}/${p.slug === 'index' ? '' : `${p.slug}.html`}</loc>
  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
