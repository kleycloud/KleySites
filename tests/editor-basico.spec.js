import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('tiene botón para volver al dashboard', async ({ sesion: page }) => {
  await expect(page.locator('#btnVolverDashboard')).toBeVisible();
});

test('se puede insertar un bloque en cada una de las tres zonas', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="texto"]'); // cae en "contenido" por defecto
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-block')).toHaveCount(1);

  await page.click('[data-zona="encabezado"]');
  await page.click('.ed-widget-card[data-tipo="imagen"]');
  await expect(page.locator('[data-zone-blocks="encabezado"] .ed-block')).toHaveCount(1);

  await page.click('[data-zona="pie"]');
  await page.click('.ed-widget-card[data-tipo="boton"]');
  await expect(page.locator('[data-zone-blocks="pie"] .ed-block')).toHaveCount(1);
});

test('deshacer y rehacer recorren el historial completo', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="texto"]');
  await page.click('.ed-widget-card[data-tipo="titulo"]');
  await expect(page.locator('.ed-block')).toHaveCount(2);

  await page.click('#btnDeshacer');
  await expect(page.locator('.ed-block')).toHaveCount(1);
  await page.click('#btnDeshacer');
  await expect(page.locator('.ed-block')).toHaveCount(0);
  await expect(page.locator('#btnDeshacer')).toBeDisabled();

  await page.click('#btnRehacer');
  await page.click('#btnRehacer');
  await expect(page.locator('.ed-block')).toHaveCount(2);
  await expect(page.locator('#btnRehacer')).toBeDisabled();
});

test('seleccionar un bloque muestra sus propiedades', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="titulo"]');
  await page.click('[data-zone-blocks="contenido"] .ed-block');
  await expect(page.locator('#propertiesBody input[data-campo="contenido.texto"]')).toBeVisible();
});
