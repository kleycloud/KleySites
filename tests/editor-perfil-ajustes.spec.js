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

test('con foto de perfil guardada, aparece "Quitar foto" y al usarlo se borra', async ({ sesion: page }) => {
  await page.route('**/kleysites/perfil', (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ perfil: { email: 'kleyder@kleysites.test', avatar_url: 'https://ejemplo.com/foto.jpg' } }),
    });
  });
  let cuerpoEnviado = null;
  await page.route('**/kleysites/perfil/avatar', (route) => {
    cuerpoEnviado = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ avatar_url: null }) });
  });
  // El perfil se carga apenas entra a la página (initPerfil), no al abrir
  // el modal — las rutas de arriba deben estar puestas antes de esa carga.
  await page.reload();

  await page.click('#btnCuentaEditor');
  await page.click('[data-accion="perfil"]');
  await expect(page.locator('#modalPerfil [data-avatar] img')).toHaveAttribute('src', 'https://ejemplo.com/foto.jpg');
  await expect(page.locator('#btnQuitarAvatar')).toBeVisible();

  await page.click('#btnQuitarAvatar');
  await expect.poll(() => cuerpoEnviado).toEqual({ avatar_url: null });
  await expect(page.locator('#modalPerfil [data-avatar] img')).toHaveCount(0);
  await expect(page.locator('#btnQuitarAvatar')).toBeHidden();
});

test('sin foto de perfil, "Quitar foto" no se muestra', async ({ sesion: page }) => {
  await page.route('**/kleysites/perfil', (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ perfil: { email: 'kleyder@kleysites.test', avatar_url: null } }),
    });
  });
  await page.reload();

  await page.click('#btnCuentaEditor');
  await page.click('[data-accion="perfil"]');
  await expect(page.locator('#perfilCorreo')).toHaveText('kleyder@kleysites.test');
  await expect(page.locator('#btnQuitarAvatar')).toBeHidden();
});

test('"Ayuda" es un enlace directo de correo, no un botón', async ({ sesion: page }) => {
  await page.click('#btnCuentaEditor');
  await expect(page.locator('[href="mailto:kleysite@gmail.com"]')).toHaveText('Ayuda');
});

test('"Mi plan" muestra el plan actual del cliente', async ({ sesion: page }) => {
  await page.route('**/kleysites/perfil', (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ perfil: { email: 'kleyder@kleysites.test', avatar_url: null, plan: 'pro' } }),
    });
  });

  await page.click('#btnCuentaEditor');
  await page.click('[data-accion="plan"]');
  await expect(page.locator('#modalPlan')).toBeVisible();
  await expect(page.locator('#planTitulo')).toHaveText('Plan Pro');

  await page.click('#btnCerrarPlan');
  await expect(page.locator('#modalPlan')).toBeHidden();
});

test('"Configuración" cambia el tema y lo recuerda entre recargas', async ({ sesion: page }) => {
  await page.click('#btnCuentaEditor');
  await page.click('[data-accion="configuracion"]');
  await expect(page.locator('#modalConfiguracion')).toBeVisible();
  await expect(page.locator('input[name="tema"][value="auto"]')).toBeChecked();

  await page.click('input[name="tema"][value="dark"]');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');

  await page.click('input[name="tema"][value="light"]');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('el panel de Ajustes revela la confirmación al eliminar sitio', async ({ sesion: page }) => {
  await page.click('.ed-rail-item[data-panel="ajustes"]');
  await expect(page.locator('#inputNombreSitioAjustes')).toBeVisible();
  await expect(page.locator('#confirmarEliminarSitio')).toBeHidden();

  await page.click('#btnEliminarSitio');
  await expect(page.locator('#confirmarEliminarSitio')).toBeVisible();
});
