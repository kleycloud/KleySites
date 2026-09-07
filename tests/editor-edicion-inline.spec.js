/*
  Prueba de regresión para un bug real: seleccionar un bloque solía
  reconstruir su innerHTML por completo, así que el segundo clic de un
  doble clic caía sobre un nodo distinto y Chromium nunca llegaba a
  disparar "dblclick". Si esta prueba empieza a fallar, es casi seguro
  que alguien volvió a poner un renderCanvas() en el camino de la
  selección (ver actualizarEstadosVisuales en render.js).
*/

import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('doble clic en un título lo pone editable y el cambio llega al panel', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="titulo"]');

  const bloque = page.locator('[data-zone-blocks="contenido"] .ed-block').first();
  await bloque.dblclick();
  await expect(page.locator('.ed-editable.is-editing')).toHaveCount(1);

  await page.keyboard.type('Encabezado de prueba');
  await page.keyboard.press('Escape');

  await expect(page.locator('[data-zone-blocks="contenido"] h2')).toHaveText('Encabezado de prueba');
  await expect(page.locator('#propertiesBody input[data-campo="contenido.texto"]')).toHaveValue('Encabezado de prueba');
  await expect(page.locator('.ed-editable.is-editing')).toHaveCount(0);
});

test('un solo clic no entra en modo edición', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="boton"]');
  await page.click('[data-zone-blocks="contenido"] .ed-block');
  await expect(page.locator('.ed-editable.is-editing')).toHaveCount(0);
});
