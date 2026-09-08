import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('cambiar fuente, peso y sombra se refleja en el lienzo', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="titulo"]');
  await page.click('[data-zone-blocks="contenido"] .ed-block');

  await page.selectOption('#propertiesBody select[data-campo="estilos.fuente"]', 'Georgia');
  await page.fill('#propertiesBody input[data-campo="estilos.tamano"]', '40');
  await page.selectOption('#propertiesBody select[data-campo="estilos.peso"]', 'negrita');
  await page.selectOption('#propertiesBody select[data-campo="estilos.sombra"]', 'sutil');
  await page.waitForTimeout(150);

  const h2 = page.locator('[data-zone-blocks="contenido"] h2');
  await expect(h2).toHaveCSS('font-family', /Georgia/);
  await expect(h2).toHaveCSS('font-size', '40px');
  await expect(h2).toHaveCSS('font-weight', '700');
  await expect(h2).toHaveCSS('box-shadow', /rgba\(0, 0, 0, 0\.12\)/);
});

test('borde solo aparece cuando el ancho está definido', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="boton"]');
  await page.click('[data-zone-blocks="contenido"] .ed-block');

  const boton = page.locator('[data-zone-blocks="contenido"] .ed-preview-btn');
  await expect(boton).toHaveCSS('border-style', 'none');

  await page.fill('#propertiesBody input[data-campo="estilos.borde"]', '2');
  await page.fill('#propertiesBody input[data-campo="estilos.borde_color"]', '#ff0000');
  await page.fill('#propertiesBody input[data-campo="estilos.radio"]', '12');
  await page.waitForTimeout(150);

  await expect(boton).toHaveCSS('border-style', 'solid');
  await expect(boton).toHaveCSS('border-width', '2px');
  await expect(boton).toHaveCSS('border-radius', '12px');
});
