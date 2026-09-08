import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('cambiar de panel en el riel muestra el contenido correcto', async ({ sesion: page }) => {
  await expect(page.locator('[data-panel-content="bloques"]')).toHaveClass(/is-active/);

  await page.click('.ed-rail-item[data-panel="capas"]');
  await expect(page.locator('[data-panel-content="capas"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-panel-content="bloques"]')).not.toHaveClass(/is-active/);
  await expect(page.locator('#panelTitle')).toHaveText('Capas');

  await page.click('.ed-rail-item[data-panel="paginas"]');
  await expect(page.locator('[data-panel-content="paginas"] #formCrearPagina')).toBeVisible();

  await page.click('.ed-rail-item[data-panel="tienda"]');
  await expect(page.locator('[data-panel-content="tienda"] .ed-panel-proximamente')).toBeVisible();
});

test('el panel de Capas refleja los bloques insertados y permite seleccionar', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="titulo"]');
  await page.click('.ed-rail-item[data-panel="capas"]');

  const fila = page.locator('.ed-capa-fila');
  await expect(fila).toHaveCount(1);
  await expect(fila).toHaveText('Título');

  await fila.click();
  await expect(page.locator('#propertiesBody input[data-campo="contenido.texto"]')).toBeVisible();
  await expect(fila).toHaveClass(/is-selected/);
});

test('una plantilla inserta una sección con sus bloques adentro', async ({ sesion: page }) => {
  await page.click('.ed-rail-item[data-panel="plantillas"]');
  await expect(page.locator('.ed-tpl-item')).toHaveCount(3);

  await page.click('.ed-tpl-item >> nth=0'); // "Encabezado con título y botón"

  const seccion = page.locator('[data-zone-blocks="contenido"] > .ed-block.ed-contenedor');
  await expect(seccion).toHaveCount(1);
  await expect(seccion.locator('> .ed-block')).toHaveCount(3); // título + texto + botón
});
