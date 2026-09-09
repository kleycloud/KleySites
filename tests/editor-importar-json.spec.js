import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('pegar JSON propio del catálogo lo convierte en bloques anidados', async ({ sesion: page }) => {
  const json = JSON.stringify([
    { tipo: 'titulo', contenido: { texto: 'Desde JSON', nivel: 'h2' } },
    { tipo: 'seccion', contenido: {}, hijos: [{ tipo: 'boton', contenido: { texto: 'Ir', href: '#' } }] },
  ]);

  await page.click('#btnImportar');
  await page.fill('#textareaImportar', json);
  await page.click('#btnConfirmarImportar');

  await expect(page.locator('#modalImportar')).toBeHidden();
  await expect(page.locator('[data-zone-blocks="contenido"] h2')).toHaveText('Desde JSON');
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-block.ed-contenedor > .ed-block')).toHaveCount(1);
});

test('un tipo fuera del catálogo en el JSON se descarta, no rompe la importación', async ({ sesion: page }) => {
  const json = JSON.stringify([
    { tipo: 'titulo', contenido: { texto: 'Válido', nivel: 'h2' } },
    { tipo: 'algo-inventado', contenido: {} },
  ]);

  await page.click('#btnImportar');
  await page.fill('#textareaImportar', json);
  await page.click('#btnConfirmarImportar');

  await expect(page.locator('[data-zone-blocks="contenido"] .ed-block')).toHaveCount(1);
});
