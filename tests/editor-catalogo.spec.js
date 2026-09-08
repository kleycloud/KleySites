/*
  Cada tipo de bloque del panel debe poder insertarse sin romper nada.
  Recorre el catálogo completo en vez de listar los tipos a mano, para que
  un tipo nuevo quede cubierto automáticamente sin tener que acordarse de
  agregarlo aquí.
*/

import { test, expect } from './fixtures.js';

test('cada tarjeta del panel de bloques inserta un bloque visible en el lienzo', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');

  const tarjetas = page.locator('.ed-widget-card');
  const total = await tarjetas.count();
  expect(total).toBeGreaterThan(0);

  for (let i = 0; i < total; i++) {
    const tipo = await tarjetas.nth(i).getAttribute('data-tipo');
    await tarjetas.nth(i).click();
    await expect(
      page.locator(`[data-zone-blocks="contenido"] .ed-block`).nth(i),
      `el bloque "${tipo}" no se insertó`,
    ).toBeVisible();
  }

  await expect(page.locator('[data-zone-blocks="contenido"] .ed-block')).toHaveCount(total);
});
