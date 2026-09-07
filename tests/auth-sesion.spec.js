import { test, expect } from './fixtures.js';

test('con token guardado, la portada salta directo al dashboard', async ({ sesion: page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard\.html$/);
});

test('el editor sin ?site= redirige al dashboard en vez de crear un sitio vacío', async ({ sesion: page }) => {
  await page.goto('/editor.html');
  await expect(page).toHaveURL(/\/dashboard\.html$/);
});
