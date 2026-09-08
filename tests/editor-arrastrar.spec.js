/*
  Arrastrar y soltar (manija .ed-drag-handle en cada bloque). Se simula con
  mouse.down/move/up en vez de page.dragAndDrop porque necesitamos soltar
  en un punto exacto (antes/después de un hermano, o dentro de un
  contenedor), no solo "en algún lugar del elemento destino".

  Dos bugs reales de este mecanismo quedaron atrapados por estas pruebas
  mientras se construía y no deberían volver:
  1. El índice de inserción se calculaba ANTES de quitar el indicador de
     la vuelta anterior de dragover — sus 3px de alto corrían el layout y
     desalineaban la medición en uno.
  2. El indicador insertado quedaba bajo el cursor y, al recibir eventos
     de puntero, el navegador perdía el destino del arrastre nativo y
     "drop" dejaba de disparar — se resuelve con pointer-events:none.
*/

import { test, expect } from './fixtures.js';

async function arrastrar(page, manija, xDestino, yDestino) {
  const box = await manija.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(xDestino, yDestino, { steps: 15 });
  await page.waitForTimeout(80);
  await page.mouse.up();
}

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('arrastrar un bloque lo reordena entre sus hermanos', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="titulo"]'); // id 1
  await page.click('.ed-widget-card[data-tipo="texto"]');  // id 2
  await page.click('.ed-widget-card[data-tipo="boton"]');  // id 3

  const bloqueB = page.locator('[data-zone-blocks="contenido"] .ed-block[data-block-id="2"]');
  const manijaC = page.locator('[data-zone-blocks="contenido"] .ed-block[data-block-id="3"] .ed-drag-handle');
  const boxB = await bloqueB.boundingBox();

  // Soltar C justo antes de B (arriba de su punto medio) → 1, 3, 2
  await arrastrar(page, manijaC, boxB.x + boxB.width / 2, boxB.y + 3);

  const orden = await page.locator('[data-zone-blocks="contenido"] .ed-block').evaluateAll(
    (els) => els.map((el) => el.dataset.blockId),
  );
  expect(orden).toEqual(['1', '3', '2']);
});

test('arrastrar un bloque a otra zona lo mueve ahí', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="titulo"]');

  const manija = page.locator('[data-zone-blocks="contenido"] .ed-block .ed-drag-handle');
  const zonaHeader = page.locator('[data-zone-blocks="encabezado"]');
  const boxHeader = await zonaHeader.boundingBox();

  await arrastrar(page, manija, boxHeader.x + boxHeader.width / 2, boxHeader.y + boxHeader.height / 2);

  await expect(page.locator('[data-zone-blocks="encabezado"] .ed-block')).toHaveCount(1);
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-block')).toHaveCount(0);
});

test('arrastrar un bloque dentro de una sección lo anida ahí', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="texto"]');   // id 1
  await page.click('.ed-widget-card[data-tipo="seccion"]'); // id 2

  const manijaTexto = page.locator('[data-zone-blocks="contenido"] .ed-block[data-block-id="1"] .ed-drag-handle');
  const seccion = page.locator('[data-zone-blocks="contenido"] .ed-block[data-block-id="2"]');
  const boxSeccion = await seccion.boundingBox();

  await arrastrar(page, manijaTexto, boxSeccion.x + boxSeccion.width / 2, boxSeccion.y + boxSeccion.height / 2);

  await expect(page.locator('[data-zone-blocks="contenido"] .ed-block[data-block-id="2"] > .ed-block')).toHaveCount(1);
  // El bloque anidado ya no está como raíz de la zona.
  await expect(page.locator('[data-zone-blocks="contenido"] > .ed-block')).toHaveCount(1);
});

test('no se puede soltar una sección dentro de sí misma', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="seccion"]'); // id 1

  const manija = page.locator('[data-zone-blocks="contenido"] .ed-block[data-block-id="1"] .ed-drag-handle');
  const seccion = page.locator('[data-zone-blocks="contenido"] .ed-block[data-block-id="1"]');
  const box = await seccion.boundingBox();

  await arrastrar(page, manija, box.x + box.width / 2, box.y + box.height / 2);

  // Sigue habiendo una sola sección, como raíz — el arrastre inválido no hizo nada.
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-block')).toHaveCount(1);
});
