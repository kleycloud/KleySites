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

test('el menú de cuenta abre el modal de perfil', async ({ sesion: page }) => {
  await page.click('#btnCuenta');
  await page.click('[data-accion="perfil"]');
  await expect(page.locator('#modalPerfil')).toBeVisible();
  await expect(page.locator('#menuCuenta')).not.toHaveClass(/is-open/);
});

test('si el backend rechaza crear el sitio (límite de plan), avisa con un modal y vuelve a la tarjeta +', async ({ sesion: page }) => {
  await page.route('**/kleysites/sites', (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill({
      status: 402,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Ya tienes 1 sitio en el plan gratis. Pasa a Pro para crear más sitios.' }),
    });
  });

  await page.click('#tarjetaCrear');
  await page.fill('#nombreNuevoSitio', 'Otro sitio');
  await page.click('#formCrear button[type="submit"]');

  await expect(page.locator('#modalLimitePlan')).toBeVisible();
  await expect(page.locator('#limitePlanMensaje')).toHaveText(/plan gratis/);

  await page.click('#btnCerrarLimitePlan');
  await expect(page.locator('#modalLimitePlan')).toBeHidden();
  await expect(page.locator('#tarjetaCrear')).toBeVisible();
  await expect(page.locator('#formCrear')).toHaveCount(0);
});

test('la segunda vez que se abre el dashboard, pinta los sitios cacheados de inmediato', async ({ sesion: page }) => {
  await page.route('**/kleysites/sites', (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sitios: [{ id: 1, nombre: 'Mi sitio', slug: 'mi-sitio' }] }),
    });
  });

  await page.reload();
  await expect(page.locator('a.db-card .db-card-nombre')).toHaveText(['Mi sitio']);

  // Segunda visita: se bloquea la red para probar que lo cacheado se
  // pinta sin esperar ninguna respuesta.
  await page.route('**/kleysites/sites', (route) => new Promise(() => {})); // nunca resuelve
  await page.reload();
  await expect(page.locator('a.db-card .db-card-nombre')).toHaveText(['Mi sitio']);
});

test('cerrar sesión borra el token y vuelve al login', async ({ sesion: page }) => {
  await page.click('#btnCuenta');
  await page.click('[data-accion="cerrar-sesion"]');
  await expect(page).toHaveURL(/\/$|\/index\.html$/);
  const token = await page.evaluate(() => localStorage.getItem('kleysites_token'));
  expect(token).toBeNull();
});
