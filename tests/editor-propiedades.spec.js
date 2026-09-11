import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('cada tipo de bloque ve solo los grupos de propiedades que le corresponden', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="texto"]');
  await expect(page.locator('#propertiesBody .ed-prop-grupo[data-grupo="tipografia"]')).toBeVisible();
  await expect(page.locator('#propertiesBody .ed-prop-grupo[data-grupo="imagen"]')).toHaveCount(0);

  await page.click('.ed-widget-card[data-tipo="imagen"]');
  await expect(page.locator('#propertiesBody .ed-prop-grupo[data-grupo="imagen"]')).toBeVisible();
  await expect(page.locator('#propertiesBody .ed-prop-grupo[data-grupo="tipografia"]')).toHaveCount(0);

  await page.click('.ed-widget-card[data-tipo="seccion"]');
  await expect(page.locator('#propertiesBody .ed-prop-grupo[data-grupo="contenedor"]')).toBeVisible();
});

test('relleno, opacidad y color se reflejan en el lienzo al instante', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="texto"]');
  const bloque = page.locator('[data-zone-blocks="contenido"] .ed-editable');

  await page.fill('#propertiesBody [data-campo-todos="padding"]', '24');
  await expect(bloque).toHaveCSS('padding-top', '24px');
  await expect(bloque).toHaveCSS('padding-left', '24px');
  await expect(page.locator('#propertiesBody input[data-campo="estilos.padding_abajo"]')).toHaveValue('24');

  await page.fill('#propertiesBody input[data-campo="estilos.opacidad"]', '50');
  await expect(bloque).toHaveCSS('opacity', '0.5');

  await page.fill('#propertiesBody input[data-campo="estilos.color"]', '#ff0000');
  await expect(bloque).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(page.locator('#propertiesBody input[data-color-para="estilos.color"]')).toHaveValue('#ff0000');
});

test('los estilos de un contenedor se aplican a la sección en el lienzo', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="seccion"]');
  await page.fill('#propertiesBody input[data-campo="estilos.fondo"]', '#00ff00');
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-contenedor')).toHaveCSS('background-color', 'rgb(0, 255, 0)');
});
