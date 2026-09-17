/*
  Bloques compuestos: testimonial, precio, FAQ, producto, redes y código
  HTML. Cubre el control "lista" (agregar/quitar filas) y que el lienzo y
  la Vista previa muestren lo mismo.
*/

import { test, expect } from './fixtures.js';

test.beforeEach(async ({ sesion: page }) => {
  await page.goto('/editor.html?site=999');
});

async function vistaPrevia(page) {
  const [popup] = await Promise.all([page.context().waitForEvent('page'), page.click('#btnVistaPrevia')]);
  await popup.waitForLoadState();
  return popup;
}

test('el FAQ agrega y quita preguntas desde el control de lista y se publica con <details>', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="faq"]');
  const lista = page.locator('#propertiesBody [data-lista="contenido.items"]');
  const detalles = page.locator('[data-zone-blocks="contenido"] details');
  await expect(lista.locator('[data-fila]')).toHaveCount(1);
  await expect(detalles).toHaveCount(1);

  await lista.locator('[data-lista-agregar]').click();
  await expect(lista.locator('[data-fila]')).toHaveCount(2);
  await lista.locator('[data-fila="1"] input[data-col="pregunta"]').fill('¿Hacen envíos?');
  await lista.locator('[data-fila="1"] textarea[data-col="respuesta"]').fill('Sí, a todo el país.');
  await expect(detalles).toHaveCount(2);
  await expect(detalles.nth(1).locator('summary')).toHaveText('¿Hacen envíos?');

  await lista.locator('[data-lista-quitar="0"]').click();
  await expect(detalles).toHaveCount(1);
  await expect(detalles.first().locator('summary')).toHaveText('¿Hacen envíos?');

  const popup = await vistaPrevia(page);
  await expect(popup.locator('main details summary')).toHaveText('¿Hacen envíos?');
  await expect(popup.locator('main details p')).toHaveText('Sí, a todo el país.');
});

test('las redes sociales se publican como enlaces con su ícono y sin esquemas peligrosos', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="redes"]');
  // (la manija de arrastre también es un span[title] con svg)
  await expect(page.locator('[data-zone-blocks="contenido"] span[title]:not(.ed-drag-handle) > svg')).toHaveCount(2);

  const lista = page.locator('#propertiesBody [data-lista="contenido.items"]');
  await lista.locator('[data-fila="0"] input[data-col="url"]').fill('https://facebook.com/mi-negocio');
  await lista.locator('[data-fila="1"] select[data-col="red"]').selectOption('whatsapp');
  await lista.locator('[data-fila="1"] input[data-col="url"]').fill('javascript:alert(1)');

  const popup = await vistaPrevia(page);
  await expect(popup.locator('a[aria-label="Facebook"]')).toHaveAttribute('href', 'https://facebook.com/mi-negocio');
  await expect(popup.locator('a[aria-label="WhatsApp"]')).toHaveAttribute('href', '#');
});

test('precio, producto y testimonial se ven en el lienzo con sus datos iniciales y sus controles', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="precio"]');
  const precio = page.locator('[data-zone-blocks="contenido"] .ed-block').nth(0);
  await expect(precio).toContainText('Plan básico');
  await expect(precio.locator('li')).toHaveCount(2);
  await page.locator('#propertiesBody [data-lista="contenido.caracteristicas"] [data-lista-agregar]').click();
  await page.locator('#propertiesBody [data-fila="2"] input[data-col="texto"]').fill('Dominio propio');
  await expect(precio.locator('li')).toHaveCount(3);

  await page.click('.ed-widget-card[data-tipo="producto"]');
  const producto = page.locator('[data-zone-blocks="contenido"] .ed-block').nth(1);
  await expect(producto).toContainText('Producto');
  await expect(producto.locator('.ed-preview-btn')).toHaveText('Comprar');
  await expect(page.locator('#propertiesBody [data-imagen="contenido.imagen"]')).toBeVisible();

  await page.click('.ed-widget-card[data-tipo="testimonial"]');
  const testimonial = page.locator('[data-zone-blocks="contenido"] .ed-block').nth(2);
  await expect(testimonial.locator('blockquote')).toContainText('Excelente servicio');
  await expect(page.locator('#propertiesBody [data-imagen="contenido.foto"]')).toBeVisible();

  const popup = await vistaPrevia(page);
  await expect(popup.locator('main a[href="#"]')).toHaveCount(2); // Elegir + Comprar
  await expect(popup.locator('main figure blockquote')).toContainText('Excelente servicio');
});

test('el bloque de código HTML conserva encabezados e imágenes', async ({ sesion: page }) => {
  await page.click('.ed-widget-card[data-tipo="html"]');
  await page.fill('#propertiesBody textarea[data-campo="contenido.html"]', '<h3>Horario</h3><img src="https://ejemplo.test/a.png" alt="a"><table><tr><td>Lun</td></tr></table>');
  const bloque = page.locator('[data-zone-blocks="contenido"] .ed-block');
  await expect(bloque.locator('h3')).toHaveText('Horario');
  await expect(bloque.locator('img')).toHaveAttribute('src', 'https://ejemplo.test/a.png');
  await expect(bloque.locator('td')).toHaveText('Lun');
});

test('un JSON con FAQ y código HTML entra al editor con sus datos y saneado', async ({ sesion: page }) => {
  await page.click('#btnImportar');
  await page.fill('#textareaImportar', JSON.stringify([
    { tipo: 'faq', contenido: { items: JSON.stringify([{ pregunta: 'P1', respuesta: 'R1' }]) } },
    { tipo: 'html', contenido: { html: '<h4>Ok</h4><script>window.__xss = true</script>' } },
    { tipo: 'seccion', contenido: { tipo_seccion: 'hero', mostrar_titulo: 'no' }, estilos: { overlay: '30', altura_min: 'pantalla' }, hijos: [{ tipo: 'titulo', contenido: { texto: 'Oculto' } }] },
  ]));
  await page.click('#btnConfirmarImportar');
  await expect(page.locator('#modalImportar')).toBeHidden();

  await expect(page.locator('[data-zone-blocks="contenido"] details summary')).toHaveText('P1');
  await expect(page.locator('[data-zone-blocks="contenido"] h4')).toHaveText('Ok');
  expect(await page.evaluate(() => window.__xss === true)).toBe(false);
  await expect(page.locator('[data-zone-blocks="contenido"] h2')).toHaveCount(0);
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-contenedor')).toHaveAttribute('style', /min-height:100vh/);
});
