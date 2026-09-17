/*
  Sección inteligente tipo "hero": composición desde la pestaña Contenido
  (fondo, oscurecer, altura, alineación), interruptores que ocultan sin
  borrar, y animación de entrada. Lo que se ve en el lienzo debe salir
  igual en la Vista previa (mismo renderizador).
*/

import { test, expect } from './fixtures.js';

const IMAGEN = 'https://ejemplo.test/fondo.jpg';

async function insertarHero(page) {
  await page.goto('/editor.html?site=999');
  await page.click('.ed-rail-item[data-panel="plantillas"]');
  await page.click('.ed-tpl-item[data-plantilla="hero"]');
}

test('la plantilla Hero crea una sección hero con sus interruptores encendidos', async ({ sesion: page }) => {
  await insertarHero(page);
  const panel = page.locator('#propertiesBody');
  await expect(panel.locator('[data-segmento="contenido.tipo_seccion"] .is-active')).toHaveText('Hero');
  await expect(panel.locator('input[data-campo="contenido.mostrar_titulo"]')).toBeChecked();
  await expect(panel.locator('[data-segmento="estilos.fondo_tipo"] .is-active')).toHaveText('Color');
  await expect(panel.locator('[data-imagen="estilos.fondo_imagen"]')).toHaveCount(0);

  const seccion = page.locator('[data-zone-blocks="contenido"] .ed-contenedor');
  await expect(seccion).toHaveCSS('min-height', /px$/);
  await expect(seccion).toHaveCSS('justify-content', 'center');
});

test('fondo con imagen, oscurecer y altura de pantalla completa se reflejan en el lienzo y en la vista previa', async ({ sesion: page }) => {
  await insertarHero(page);
  const panel = page.locator('#propertiesBody');

  await panel.locator('[data-segmento="estilos.fondo_tipo"] [data-valor="imagen"]').click();
  await panel.locator('[data-imagen="estilos.fondo_imagen"] input[data-campo]').fill(IMAGEN);
  await panel.locator('input[data-campo="estilos.overlay"]').fill('40');
  await panel.locator('[data-segmento="estilos.altura_min"] [data-valor="pantalla"]').click();

  const seccion = page.locator('[data-zone-blocks="contenido"] .ed-contenedor');
  await expect(seccion).toHaveCSS('background-image', `url("${IMAGEN}")`);
  await expect(seccion).toHaveAttribute('style', /min-height:100vh/);
  const overlay = seccion.locator('> .ed-capa-fondo');
  await expect(overlay).toHaveCount(1);
  await expect(overlay).toHaveCSS('background-color', 'rgba(0, 0, 0, 0.4)');
  await expect(overlay).toHaveCSS('pointer-events', 'none');

  // Un hijo sigue siendo hijo directo del contenedor (drag & drop intacto).
  await expect(seccion.locator('> .ed-block')).toHaveCount(3);

  const [popup] = await Promise.all([page.context().waitForEvent('page'), page.click('#btnVistaPrevia')]);
  await popup.waitForLoadState();
  const publicada = popup.locator('main > section');
  await expect(publicada).toHaveCSS('background-image', `url("${IMAGEN}")`);
  await expect(publicada).toHaveAttribute('style', /min-height:100vh/);
  await expect(publicada.locator('> div[style*="rgba(0,0,0,0.4)"]')).toHaveCount(1);
});

test('video de fondo agrega una capa de video silenciada detrás del contenido', async ({ sesion: page }) => {
  await insertarHero(page);
  const panel = page.locator('#propertiesBody');
  await panel.locator('[data-segmento="estilos.fondo_tipo"] [data-valor="video"]').click();
  await panel.locator('input[data-campo="estilos.fondo_video"]').fill('https://ejemplo.test/clip.mp4');

  const video = page.locator('[data-zone-blocks="contenido"] .ed-contenedor > video.ed-capa-fondo');
  await expect(video).toHaveAttribute('src', 'https://ejemplo.test/clip.mp4');
  await expect(video).toHaveAttribute('muted', '');
  await expect(video).toHaveAttribute('loop', '');
});

test('apagar "Mostrar título" oculta el título sin borrarlo, y vuelve al prenderlo', async ({ sesion: page }) => {
  await insertarHero(page);
  const panel = page.locator('#propertiesBody');
  const titulo = page.locator('[data-zone-blocks="contenido"] h1');
  await expect(titulo).toHaveText('Bienvenido a tu sitio');

  await panel.locator('input[data-campo="contenido.mostrar_titulo"]').click();
  await expect(titulo).toHaveCount(0);
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-preview-btn')).toBeVisible();

  await page.click('.ed-rail-item[data-panel="capas"]');
  const capaTitulo = page.locator('#layersTree .ed-capa-fila.is-oculta');
  await expect(capaTitulo).toHaveCount(1);
  await expect(capaTitulo).toContainText('Título');
  await expect(capaTitulo).toContainText('(oculto)');

  const [popup] = await Promise.all([page.context().waitForEvent('page'), page.click('#btnVistaPrevia')]);
  await popup.waitForLoadState();
  await expect(popup.locator('h1')).toHaveCount(0);
  await expect(popup.locator('a[href="#"]')).toHaveText('Empezar');
  await popup.close();

  await page.locator('#layersTree .ed-capa-fila').first().click(); // la sección
  await panel.locator('input[data-campo="contenido.mostrar_titulo"]').click();
  await expect(titulo).toHaveText('Bienvenido a tu sitio');
  await expect(page.locator('#layersTree .ed-capa-fila.is-oculta')).toHaveCount(0);
});

test('una sección libre se vuelve hero desde el segmentado y muestra la composición', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
  await page.click('.ed-widget-card[data-tipo="seccion"]');
  const panel = page.locator('#propertiesBody');
  await expect(panel.locator('[data-segmento="estilos.fondo_tipo"]')).toHaveCount(0);

  await panel.locator('[data-segmento="contenido.tipo_seccion"] [data-valor="hero"]').click();
  await expect(panel.locator('[data-segmento="estilos.fondo_tipo"]')).toBeVisible();
  await expect(panel.locator('input[data-campo="contenido.mostrar_titulo"]')).toBeChecked();
});

test('la animación de entrada de la pestaña Avanzado llega al lienzo y a la vista previa', async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
  await page.click('.ed-widget-card[data-tipo="titulo"]');
  await page.click('#propertiesBody [data-tab="avanzado"]');
  await page.selectOption('#propertiesBody select[data-campo="estilos.animacion"]', 'subir');

  await expect(page.locator('[data-zone-blocks="contenido"] h2')).toHaveCSS('animation-name', 'kley-subir');

  const [popup] = await Promise.all([page.context().waitForEvent('page'), page.click('#btnVistaPrevia')]);
  await popup.waitForLoadState();
  await expect(popup.locator('h2')).toHaveCSS('animation-name', 'kley-subir');
});
