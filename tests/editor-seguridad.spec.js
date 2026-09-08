/*
  El bloque "texto" es el único que guarda HTML crudo (contenido.html),
  escrito por el usuario desde el textarea de propiedades o la edición
  directa en el lienzo. Si alguna vez se quita el saneo de escribirCampo
  (state.js) o de renderContenido (render.js), esta prueba debe fallar.
*/

import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('una etiqueta <script> escrita en el campo de texto no se ejecuta ni queda en el lienzo', async ({ sesion: page }) => {
  page.on('dialog', (dialog) => dialog.dismiss()); // si el saneo fallara, un alert() confirmaría la ejecución

  await page.click('.ed-widget-card[data-tipo="texto"]');
  await page.click('[data-zone-blocks="contenido"] .ed-block');

  const textarea = page.locator('#propertiesBody textarea[data-campo="contenido.html"]');
  await textarea.fill('<script>window.__xss = true;</script><b>hola</b>');
  await page.waitForTimeout(200); // pasa el debounce del autoguardado/historial

  const seEjecuto = await page.evaluate(() => window.__xss === true);
  expect(seEjecuto).toBe(false);

  const html = await page.locator('[data-zone-blocks="contenido"] .ed-editable').innerHTML();
  expect(html).not.toContain('<script');
  expect(html).toContain('<b>hola</b>');
});

test('un atributo onerror en una etiqueta permitida se elimina', async ({ sesion: page }) => {
  page.on('dialog', (dialog) => dialog.dismiss());

  await page.click('.ed-widget-card[data-tipo="texto"]');
  await page.click('[data-zone-blocks="contenido"] .ed-block');

  const textarea = page.locator('#propertiesBody textarea[data-campo="contenido.html"]');
  await textarea.fill('<b onclick="window.__xss = true">clic</b>');
  await page.waitForTimeout(200);

  const html = await page.locator('[data-zone-blocks="contenido"] .ed-editable').innerHTML();
  expect(html).not.toContain('onclick');
});
