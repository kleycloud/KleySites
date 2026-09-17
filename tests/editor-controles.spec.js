/*
  Controles del panel de propiedades que no son un simple input: el
  selector de imagen (subida a Cloudinary simulada, Quitar, pegar URL).
*/

import { test, expect } from './fixtures.js';

const URL_SUBIDA = 'https://res.cloudinary.com/demo/foto.png';

test.beforeEach(async ({ sesion: page }) => {
  await page.route('https://api.cloudinary.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ secure_url: URL_SUBIDA }),
  }));
  await page.goto('/editor.html?site=999');
  await page.click('.ed-widget-card[data-tipo="imagen"]');
});

test('el control de imagen sube un archivo, lo muestra en el lienzo y permite quitarlo', async ({ sesion: page }) => {
  const control = page.locator('#propertiesBody [data-imagen="contenido.src"]');
  await expect(control.locator('[data-imagen-subir]')).toHaveText('Subir');
  await expect(control.locator('[data-imagen-quitar]')).toBeHidden();

  await control.locator('[data-imagen-archivo]').setInputFiles({
    name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from('png-falso'),
  });

  await expect(control.locator('.ed-imagen-preview img')).toHaveAttribute('src', URL_SUBIDA);
  await expect(control.locator('input[data-campo="contenido.src"]')).toHaveValue(URL_SUBIDA);
  await expect(control.locator('[data-imagen-subir]')).toHaveText('Cambiar');
  await expect(page.locator('[data-zone-blocks="contenido"] img')).toHaveAttribute('src', URL_SUBIDA);

  await control.locator('[data-imagen-quitar]').click();
  await expect(control.locator('.ed-imagen-preview img')).toHaveCount(0);
  await expect(control.locator('input[data-campo="contenido.src"]')).toHaveValue('');
});

test('pegar una URL en el control de imagen actualiza la vista previa sin perder el foco', async ({ sesion: page }) => {
  const input = page.locator('#propertiesBody input[data-campo="contenido.src"]');
  await input.fill('https://ejemplo.test/a.png');
  await expect(page.locator('#propertiesBody .ed-imagen-preview img')).toHaveAttribute('src', 'https://ejemplo.test/a.png');
  await expect(input).toBeFocused();
});

test('si Cloudinary falla, el control avisa y deja volver a intentar', async ({ sesion: page }) => {
  await page.route('https://api.cloudinary.com/**', (route) => route.fulfill({ status: 500, body: 'error' }));
  const control = page.locator('#propertiesBody [data-imagen="contenido.src"]');
  await control.locator('[data-imagen-archivo]').setInputFiles({
    name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from('png-falso'),
  });
  await expect(control.locator('.ed-imagen-error')).toBeVisible();
  await expect(control.locator('[data-imagen-subir]')).toBeEnabled();
  await expect(control.locator('[data-imagen-subir]')).toHaveText('Subir');
});
