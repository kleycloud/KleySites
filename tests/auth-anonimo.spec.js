import { test, expect } from '@playwright/test';

test.describe('sin sesión guardada', () => {
  test('dashboard.html redirige al login', async ({ page }) => {
    await page.goto('/dashboard.html');
    await expect(page).toHaveURL('/');
  });

  test('editor.html redirige al login', async ({ page }) => {
    await page.goto('/editor.html?site=1');
    await expect(page).toHaveURL('/');
  });
});
