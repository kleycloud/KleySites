import { test, expect } from './fixtures.js';

const ZONAS = [
  { zona: 'encabezado', nombre: 'Header', texto: 'Añade tu logo, menú y elementos principales', color: 'rgb(77, 107, 255)' },
  { zona: 'hero', nombre: 'Hero', texto: 'Destaca tu mensaje principal con una imagen o botón que llame la atención', color: 'rgb(236, 72, 153)' },
  { zona: 'contenido', nombre: 'Contenido', texto: 'Escribe o empieza a dar vida a tu página o sitio web', color: 'rgb(123, 92, 255)' },
  { zona: 'pie', nombre: 'Footer', texto: 'Incluye tu información legal, datos de contacto y enlaces de navegación', color: 'rgb(255, 138, 61)' },
];

test('un lienzo vacío muestra las cuatro zonas con su ícono, nombre y descripción en su color', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');

  for (const z of ZONAS) {
    const vacio = page.locator(`[data-zone-blocks="${z.zona}"] .ed-zone-empty`);
    await expect(vacio.locator('.ed-zone-empty-nombre')).toHaveText(z.nombre);
    await expect(vacio.locator('.ed-zone-empty-text')).toHaveText(z.texto);
    await expect(vacio.locator('.ed-zone-empty-nombre')).toHaveCSS('color', z.color);
    await expect(vacio.locator('.icon-frame')).toHaveCSS('color', z.color);
  }
});

test('al insertar un bloque desaparece el estado vacío de esa zona nada más', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
  await page.click('.ed-widget-card[data-tipo="titulo"]');

  await expect(page.locator('[data-zone-blocks="contenido"] .ed-zone-empty')).toHaveCount(0);
  await expect(page.locator('[data-zone-blocks="encabezado"] .ed-zone-empty')).toBeVisible();
  await expect(page.locator('[data-zone-blocks="hero"] .ed-zone-empty')).toBeVisible();
  await expect(page.locator('[data-zone-blocks="pie"] .ed-zone-empty')).toBeVisible();
});
