import { test, expect } from './fixtures.js';

// El último test simula el backend con page.route ANTES de cargar el
// editor; por eso el goto no va en un beforeEach global (una carga previa
// contra la API real dejaría peticiones en vuelo que ensucian el mock).
test.beforeEach(async ({ sesion: page }, testInfo) => {
  if (!testInfo.title.includes('varias páginas')) await page.goto('/editor.html?site=999');
});

async function importar(page, texto) {
  await page.click('#btnImportar');
  await page.fill('#textareaImportar', texto);
  await page.click('#btnConfirmarImportar');
  await expect(page.locator('#modalImportar')).toBeHidden();
}

test('un JSON KleySites conserva los estilos de cada bloque', async ({ sesion: page }) => {
  await importar(page, JSON.stringify([
    { tipo: 'titulo', contenido: { texto: 'Rojo', nivel: 'h2' }, estilos: { color: '#ff0000', padding_arriba: '20', inventada: 'x' } },
  ]));

  const h2 = page.locator('[data-zone-blocks="contenido"] h2');
  await expect(h2).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(h2).toHaveCSS('padding-top', '20px');

  await page.click('[data-zone-blocks="contenido"] .ed-block');
  await page.click('#propertiesBody [data-tab="estilo"]');
  await expect(page.locator('#propertiesBody input[data-campo="estilos.color"]')).toHaveValue('#ff0000');
});

test('HTML con <style> y clases entra con sus estilos reales, editables', async ({ sesion: page }) => {
  await importar(page, `
    <style>.hero { background: #112233; padding: 40px; } .hero h1 { color: #ff0000; text-align: center; }</style>
    <div class="hero"><h1>Hola</h1><p>Bienvenido</p></div>`);

  const seccion = page.locator('[data-zone-blocks="contenido"] .ed-contenedor');
  await expect(seccion).toHaveCSS('background-color', 'rgb(17, 34, 51)');
  await expect(seccion).toHaveCSS('padding-top', '40px');

  const h1 = page.locator('[data-zone-blocks="contenido"] h1');
  await expect(h1).toHaveText('Hola');
  await expect(h1).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(h1).toHaveCSS('text-align', 'center');

  await page.click('[data-zone-blocks="contenido"] h1');
  await page.click('#propertiesBody [data-tab="estilo"]');
  await expect(page.locator('#propertiesBody select[data-campo="estilos.alineacion"]')).toHaveValue('centro');
});

test('<header> y <footer> del HTML van a sus zonas del lienzo', async ({ sesion: page }) => {
  await importar(page, '<header><h1>Marca</h1></header><main><p>Cuerpo</p></main><footer><p>Legal</p></footer>');

  await expect(page.locator('[data-zone-blocks="encabezado"] h1')).toHaveText('Marca');
  await expect(page.locator('[data-zone-blocks="pie"] .ed-editable')).toHaveText('Legal');
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-editable')).toHaveText('Cuerpo');
});

test('un JSON inválido muestra un error claro en vez de convertirse en texto', async ({ sesion: page }) => {
  await page.click('#btnImportar');
  await page.fill('#textareaImportar', '{ "paginas": [ esto no es json');
  await page.click('#btnConfirmarImportar');

  await expect(page.locator('#modalImportarError')).toContainText('JSON no es válido');
  await expect(page.locator('[data-zone-blocks="contenido"] .ed-block')).toHaveCount(0);
});

test('un proyecto con varias páginas crea las que faltan y guarda sus bloques', async ({ sesion: page }) => {
  // Backend simulado: el editor crea "Inicio" al arrancar (id 1) y la
  // importación debe crear solo "Contacto" (id 2) y guardar ahí su bloque.
  const creadas = [];
  const guardados = [];
  await page.route('**/kleysites/pages**', (route) => {
    if (route.request().method() === 'POST') {
      const nombre = route.request().postDataJSON().nombre;
      creadas.push(nombre);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ pagina: { id: creadas.length, nombre, slug: nombre.toLowerCase() } }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ paginas: [] }) });
  });
  await page.route('**/kleysites/blocks**', (route) => {
    if (route.request().method() === 'POST') {
      guardados.push(route.request().postDataJSON());
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ bloque: { id: 100 + guardados.length } }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ bloques: [] }) });
  });
  await page.goto('/editor.html?site=999');
  await expect.poll(() => creadas).toEqual(['Inicio']);

  await importar(page, JSON.stringify({
    version: 1,
    paginas: [
      { nombre: 'Inicio', zonas: { contenido: [{ tipo: 'titulo', contenido: { texto: 'Portada', nivel: 'h1' } }] } },
      { nombre: 'Contacto', zonas: { contenido: [{ tipo: 'formulario', contenido: { titulo: 'Escríbenos', boton: 'Enviar' } }] } },
    ],
  }));

  await expect(page.locator('[data-zone-blocks="contenido"] h1')).toHaveText('Portada');
  await expect.poll(() => creadas).toEqual(['Inicio', 'Contacto']);
  const remotos = guardados.filter((b) => b.page_id === 2);
  expect(remotos).toHaveLength(1);
  expect(remotos[0]).toMatchObject({ tipo: 'formulario', zona: 'contenido' });
});
