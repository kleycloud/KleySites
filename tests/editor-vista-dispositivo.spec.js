import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('cambiar la vista de dispositivo ajusta el ancho del lienzo', async ({ sesion: page }) => {
  const pagina = page.locator('.ed-page');
  await expect(pagina).not.toHaveClass(/ed-page--tablet|ed-page--movil/);

  await page.click('[data-vista="tablet"]');
  await expect(pagina).toHaveClass(/ed-page--tablet/);
  await expect(page.locator('[data-vista="tablet"] .icon-frame')).toHaveClass(/is-active/);
  await expect(page.locator('[data-vista="escritorio"] .icon-frame')).not.toHaveClass(/is-active/);

  await page.click('[data-vista="movil"]');
  await expect(pagina).toHaveClass(/ed-page--movil/);
  await expect(pagina).not.toHaveClass(/ed-page--tablet/);

  await page.click('[data-vista="escritorio"]');
  await expect(pagina).not.toHaveClass(/ed-page--tablet|ed-page--movil/);
});
