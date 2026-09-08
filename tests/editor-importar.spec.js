import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('pegar HTML y confirmar lo convierte en bloques', async ({ sesion: page }) => {
  await page.click('#btnImportar');
  await expect(page.locator('#modalImportar')).toBeVisible();

  await page.fill('#textareaImportar', '<h1>Bienvenido</h1><p>Un párrafo de ejemplo.</p><img src="https://ejemplo.com/foto.jpg" alt="Foto">');
  await page.click('#btnConfirmarImportar');

  await expect(page.locator('#modalImportar')).toBeHidden();
  const bloques = page.locator('[data-zone-blocks="contenido"] .ed-block');
  await expect(bloques).toHaveCount(3);
  await expect(page.locator('[data-zone-blocks="contenido"] h1')).toHaveText('Bienvenido');
  await expect(page.locator('[data-zone-blocks="contenido"] img')).toHaveAttribute('src', 'https://ejemplo.com/foto.jpg');
});

test('un <script> pegado en el importador no se ejecuta ni sobrevive', async ({ sesion: page }) => {
  page.on('dialog', (dialog) => dialog.dismiss());

  await page.click('#btnImportar');
  await page.fill('#textareaImportar', '<p>texto con <b onclick="window.__xss = true">clic</b> adentro</p><script>window.__xss = true;</script>');
  await page.click('#btnConfirmarImportar');

  const seEjecuto = await page.evaluate(() => window.__xss === true);
  expect(seEjecuto).toBe(false);

  const html = await page.locator('[data-zone-blocks="contenido"] .ed-editable').innerHTML();
  expect(html).not.toContain('<script');
  expect(html).not.toContain('onclick');
});

test('importar sin nada que convertir muestra un error y no cierra el modal', async ({ sesion: page }) => {
  await page.click('#btnImportar');
  await page.click('#btnConfirmarImportar');
  await expect(page.locator('#modalImportarError')).toBeVisible();
  await expect(page.locator('#modalImportar')).toBeVisible();
});

test('cancelar cierra el modal sin insertar nada', async ({ sesion: page }) => {
  await page.click('#btnImportar');
  await page.fill('#textareaImportar', '<h1>No debería quedar</h1>');
  await page.click('#btnCancelarImportar');

  await expect(page.locator('#modalImportar')).toBeHidden();
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-block')).toHaveCount(0);
});
