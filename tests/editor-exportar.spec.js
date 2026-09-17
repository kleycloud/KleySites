import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
import { test, expect } from './fixtures.js';

test('Exportar descarga un ZIP con el sitio completo, y el HTML lleva los estilos del lienzo', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
  await page.click('.ed-widget-card[data-tipo="titulo"]');
  await page.fill('#propertiesBody input[data-campo="contenido.texto"]', 'Título exportado');
  await page.click('#propertiesBody [data-tab="estilo"]');
  await page.fill('#propertiesBody input[data-campo="estilos.color"]', '#ff0000');

  await page.click('.ed-rail-item[data-panel="ajustes"]');
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#btnExportar'),
  ]);
  expect(descarga.suggestedFilename()).toMatch(/\.zip$/);

  const archivos = unzipSync(readFileSync(await descarga.path()));
  const nombres = Object.keys(archivos).sort();
  expect(nombres).toEqual(['LEEME.txt', 'index.html', 'kleysites.json', 'manifest.json', 'robots.txt', 'sitemap.xml']);

  const sitemap = strFromU8(archivos['sitemap.xml']);
  expect(sitemap).toContain('<loc>https://mi-sitio-nuevo.pages.dev/</loc>');
  const robots = strFromU8(archivos['robots.txt']);
  expect(robots).toContain('Sitemap: https://mi-sitio-nuevo.pages.dev/sitemap.xml');

  const html = strFromU8(archivos['index.html']);
  expect(html).toContain('Título exportado');
  expect(html).toContain('color:#ff0000');
  expect(html).toContain('<link rel="manifest" href="manifest.json">');

  const proyecto = JSON.parse(strFromU8(archivos['kleysites.json']));
  expect(proyecto.version).toBe(1);
  expect(proyecto.paginas[0].zonas.contenido[0]).toMatchObject({
    tipo: 'titulo',
    contenido: { texto: 'Título exportado' },
    estilos: { color: '#ff0000' },
  });

  const manifest = JSON.parse(strFromU8(archivos['manifest.json']));
  expect(manifest.start_url).toBe('./index.html');

  await expect(page.locator('#btnExportar')).toBeEnabled();
});
