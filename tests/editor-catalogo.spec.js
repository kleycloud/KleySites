/*
  Cada tipo de bloque del panel debe poder insertarse sin romper nada.
  Recorre el catálogo completo en vez de listar los tipos a mano, para que
  un tipo nuevo quede cubierto automáticamente sin tener que acordarse de
  agregarlo aquí.
*/

import { test, expect } from './fixtures.js';

test('cada tarjeta del panel de bloques inserta un bloque visible en el lienzo', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');

  // Las tarjetas "Próximamente" no son tipos del catálogo: se prueban aparte.
  const tarjetas = page.locator('.ed-widget-card:not([data-proximamente])');
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

test('una tarjeta "Próximamente" se ve deshabilitada y no inserta nada', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');

  const pronto = page.locator('.ed-widget-card[data-proximamente]');
  await expect(pronto.first()).toBeVisible();
  await expect(pronto.first().locator('.ed-widget-soon')).toHaveText('Próximamente');

  await pronto.first().click();
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-block')).toHaveCount(0);
});

test('el panel agrupa los bloques por categoría y el buscador filtra sin acentos', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');

  await expect(page.locator('.ed-widget-categoria[data-categoria="basicos"] .ed-widget-card[data-tipo="titulo"]')).toBeVisible();
  await expect(page.locator('.ed-widget-categoria[data-categoria="avanzados"] .ed-widget-card[data-tipo="galeria"]')).toBeVisible();

  await page.fill('#inputBuscarBloques', 'titulo');
  await expect(page.locator('.ed-widget-card[data-tipo="titulo"]')).toBeVisible();
  await expect(page.locator('.ed-widget-card[data-tipo="imagen"]')).toBeHidden();
  await expect(page.locator('.ed-widget-categoria[data-categoria="avanzados"]')).toBeHidden();

  await page.fill('#inputBuscarBloques', '');
  await expect(page.locator('.ed-widget-card[data-tipo="imagen"]')).toBeVisible();
  await expect(page.locator('.ed-widget-categoria[data-categoria="avanzados"]')).toBeVisible();
});
