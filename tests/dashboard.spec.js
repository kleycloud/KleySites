import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/dashboard.html');
});

test('muestra la galería de plantillas para empezar un sitio', async ({ sesion: page }) => {
  await expect(page.locator('.db-tpl-card')).toHaveCount(5);
});

test('el menú de cuenta abre y cierra', async ({ sesion: page }) => {
  await page.click('#btnCuenta');
  await expect(page.locator('#menuCuenta')).toHaveClass(/is-open/);

  await page.click('body', { position: { x: 5, y: 5 } });
  await expect(page.locator('#menuCuenta')).not.toHaveClass(/is-open/);
});

test('cerrar sesión borra el token y vuelve al login', async ({ sesion: page }) => {
  await page.click('#btnCuenta');
  await page.click('[data-accion="cerrar-sesion"]');
  await expect(page).toHaveURL(/\/$|\/index\.html$/);
  const token = await page.evaluate(() => localStorage.getItem('kleysites_token'));
  expect(token).toBeNull();
});
