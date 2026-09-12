import { test, expect } from './fixtures.js';

test('Dominios y Facturación están deshabilitados en la barra lateral', async ({ sesion: page }) => {
  await page.goto('/dashboard.html');
  const items = page.locator('.db-sidebar-item', { hasText: 'Dominios' })
    .or(page.locator('.db-sidebar-item', { hasText: 'Facturación' }));
  await expect(items).toHaveCount(2);
  for (const item of await items.all()) await expect(item).toBeDisabled();
});

test('el saludo muestra el nombre real de la cuenta, no el correo', async ({ sesion: page }) => {
  await page.route('**/kleysites/perfil', (route) => (route.request().method() !== 'GET' ? route.fallback() : route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ perfil: { email: 'ana@kleysites.test', plan: 'gratis', nombre: 'Ana' } }),
  })));
  await page.goto('/dashboard.html');
  await expect(page.locator('[data-nombre-saludo]').first()).toHaveText('Ana');
  await expect(page.locator('[data-plan-etiqueta]')).toHaveText('Plan Gratis');
});

test('sin nombre guardado, el saludo deriva uno del correo', async ({ sesion: page }) => {
  await page.route('**/kleysites/perfil', (route) => (route.request().method() !== 'GET' ? route.fallback() : route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ perfil: { email: 'martin.rios@kleysites.test', plan: 'gratis', nombre: null } }),
  })));
  await page.goto('/dashboard.html');
  await expect(page.locator('[data-nombre-saludo]').first()).toHaveText('Martin Rios');
});

test('las estadísticas se calculan de los sitios reales, no son inventadas', async ({ sesion: page }) => {
  const ahora = new Date().toISOString();
  await page.route('**/kleysites/perfil', (route) => (route.request().method() !== 'GET' ? route.fallback() : route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ perfil: { email: 'x@x.com', plan: 'pro' } }),
  })));
  await page.route('**/kleysites/sites', (route) => (route.request().method() !== 'GET' ? route.fallback() : route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ sitios: [
      { id: 1, nombre: 'Uno', slug: 'uno', created_at: ahora, published_at: ahora, paginas_count: 3 },
      { id: 2, nombre: 'Dos', slug: 'dos', created_at: ahora, published_at: null, paginas_count: 5 },
    ] }),
  })));

  await page.goto('/dashboard.html');
  const valores = page.locator('.db-stat-valor');
  await expect(valores.nth(0)).toHaveText('2'); // sitios creados
  await expect(valores.nth(1)).toHaveText('8'); // páginas totales (3+5)
  await expect(valores.nth(2)).toHaveText('1'); // sitios publicados
  await expect(valores.nth(3)).toHaveText('Pro'); // plan actual
  await expect(page.locator('.db-stat-delta')).toHaveText('+2 este mes');
});

test('el buscador de la topbar filtra "Mis sitios" por nombre', async ({ sesion: page }) => {
  await page.route('**/kleysites/sites', (route) => (route.request().method() !== 'GET' ? route.fallback() : route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ sitios: [
      { id: 1, nombre: 'Clínica Norte', slug: 'clinica-norte', created_at: new Date().toISOString() },
      { id: 2, nombre: 'Tienda Sur', slug: 'tienda-sur', created_at: new Date().toISOString() },
    ] }),
  })));

  await page.goto('/dashboard.html');
  await expect(page.locator('a.db-card')).toHaveCount(2);

  await page.fill('#inputBuscarSitios', 'norte');
  await expect(page.locator('a.db-card:visible')).toHaveCount(1);
  await expect(page.locator('a.db-card:visible .db-card-nombre')).toHaveText('Clínica Norte');
  await expect(page.locator('#tarjetaCrear')).toBeVisible(); // la de crear nunca se esconde

  await page.fill('#inputBuscarSitios', '');
  await expect(page.locator('a.db-card:visible')).toHaveCount(2);
});

test('la tarjeta de un sitio muestra Publicado o Borrador según corresponda', async ({ sesion: page }) => {
  await page.route('**/kleysites/sites', (route) => (route.request().method() !== 'GET' ? route.fallback() : route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ sitios: [
      { id: 1, nombre: 'Ya publicado', slug: 'ya-publicado', published_at: '2025-01-01T00:00:00Z', created_at: '2025-01-01T00:00:00Z', paginas_count: 2 },
      { id: 2, nombre: 'Todavía no', slug: 'todavia-no', published_at: null, created_at: '2025-01-01T00:00:00Z', paginas_count: 1 },
    ] }),
  })));

  await page.goto('/dashboard.html');
  await expect(page.locator('.db-card-badge[data-estado="publicado"]')).toHaveText('Publicado');
  await expect(page.locator('.db-card-badge[data-estado="borrador"]')).toHaveText('Borrador');
});
