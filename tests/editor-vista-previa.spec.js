import { test, expect } from './fixtures.js';

test('Vista previa abre una pestaña con el HTML del lienzo actual', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
  await page.click('.ed-widget-card[data-tipo="titulo"]');
  await page.click('[data-zone-blocks="contenido"] .ed-block');
  await page.fill('#propertiesBody input[data-campo="contenido.texto"]', 'Título de prueba');

  const [popup] = await Promise.all([
    page.context().waitForEvent('page'),
    page.click('#btnVistaPrevia'),
  ]);
  await popup.waitForLoadState();

  await expect(popup.locator('h2')).toHaveText('Título de prueba');
});
