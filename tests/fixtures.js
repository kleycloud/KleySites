/*
  fixtures.js
  Fixture compartido para pruebas que necesitan sesión iniciada.

  Usa `storageState` (no `addInitScript`) para sembrar el token: storageState
  se aplica una sola vez, al crear el contexto, igual que un localStorage
  real ya persistido. `addInitScript` en cambio reinyecta su script en CADA
  navegación — con eso, una prueba de "cerrar sesión" nunca podría ver el
  token realmente borrado, porque el propio script de prueba lo volvería a
  poner ahí antes de que la app lo revisara.

  También vigila que la página no lance ninguna excepción de JS sin
  capturar durante la prueba — la red puede fallar (backend real, token
  falso) sin que eso sea un error de la app, pero un pageerror sí lo es
  siempre.
*/

import { test as base, expect } from '@playwright/test';

const TOKEN_DE_PRUEBA = 'token-de-prueba';

export const test = base.extend({
  sesion: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [{ origin: baseURL, localStorage: [{ name: 'kleysites_token', value: TOKEN_DE_PRUEBA }] }],
      },
    });
    const page = await context.newPage();
    const erroresJS = [];
    page.on('pageerror', (err) => erroresJS.push(String(err)));

    await use(page);

    expect(erroresJS, `Excepciones de JS no capturadas: ${erroresJS.join('; ')}`).toEqual([]);
    await context.close();
  },
});

export { expect };
