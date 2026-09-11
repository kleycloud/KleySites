import { test, expect } from './fixtures.js';

test('el botón Publicar avisa con un modal si no hay conexión y se vuelve a habilitar', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
  const btn = page.locator('#btnPublicar');
  await btn.click();
  await expect(page.locator('#modalAviso')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#avisoMensaje')).not.toHaveText('');

  await page.click('#btnAvisoOk');
  await expect(page.locator('#modalAviso')).toBeHidden();
  await expect(btn).toBeEnabled();
});

test('al publicar con éxito sin url igual avisa que se publicó', async ({ sesion: page }) => {
  await page.route('**/kleysites/publish', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ publicado: true }),
  }));

  await page.goto('/editor.html?site=999');
  await page.click('#btnPublicar');

  await expect(page.locator('#modalAviso')).toBeVisible();
  await expect(page.locator('#avisoTitulo')).toHaveText('¡Publicado!');
});

test('al publicar con éxito se abre el modal con el enlace', async ({ sesion: page }) => {
  await page.route('**/kleysites/publish', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ publicado: true, slug: 'demo', url: 'https://demo.pages.dev' }),
  }));

  await page.goto('/editor.html?site=999');
  await page.click('#btnPublicar');

  await expect(page.locator('#modalPublicado')).toBeVisible();
  await expect(page.locator('#publicadoUrlInput')).toHaveValue('https://demo.pages.dev');
  await expect(page.locator('#linkVerSitio')).toHaveAttribute('href', 'https://demo.pages.dev');

  await page.click('#btnCerrarPublicado');
  await expect(page.locator('#modalPublicado')).toBeHidden();
});
