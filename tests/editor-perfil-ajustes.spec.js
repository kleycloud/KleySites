import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

test('el menú de cuenta abre el modal de perfil', async ({ sesion: page }) => {
  await page.click('#btnCuentaEditor');
  await page.click('[data-accion="perfil"]');
  await expect(page.locator('#modalPerfil')).toBeVisible();
  await expect(page.locator('#menuCuentaEditor')).not.toHaveClass(/is-open/);

  await page.click('#btnCerrarPerfil');
  await expect(page.locator('#modalPerfil')).toBeHidden();
});

test('el panel de Ajustes revela la confirmación al eliminar sitio', async ({ sesion: page }) => {
  await page.click('.ed-rail-item[data-panel="ajustes"]');
  await expect(page.locator('#inputNombreSitioAjustes')).toBeVisible();
  await expect(page.locator('#confirmarEliminarSitio')).toBeHidden();

  await page.click('#btnEliminarSitio');
  await expect(page.locator('#confirmarEliminarSitio')).toBeVisible();
});
