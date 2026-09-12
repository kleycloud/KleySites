/*
  miniatura.js
  Miniatura del sitio para la tarjeta del dashboard: se genera gratis,
  renderizando el HTML final (el mismo de Exportar/Vista previa) en un
  iframe oculto y convirtiéndolo a imagen con html2canvas — en vez de
  pagar un servicio externo de capturas de pantalla.

  Por qué un iframe con el HTML final y no una foto directa del lienzo
  del editor: html2canvas re-analiza el CSS de la página a mano y no
  entiende `color-mix()` (lo usan por todo el tema de la app, para
  hovers/selección) — truena apenas toca cualquier elemento del editor.
  El HTML que genera generarDocumento() es CSS inline plano (sin
  color-mix), así que no choca; y de paso la miniatura sale limpia, sin
  manijas de arrastre ni bordes de selección del editor.
*/

import html2canvas from 'html2canvas';
import { generarDocumento } from '../render/documento.js';
import { subirACloudinary } from '../cloudinary.js';
import { guardarMiniaturaSitio, clienteId } from '../api.js';
import { state } from './state.js';

function crearIframeOculto(html) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:1200px;height:800px;border:0;visibility:hidden';
    iframe.onload = () => resolve(iframe);
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}

export async function capturarYSubirMiniatura(siteId) {
  const titulo = document.getElementById('siteName')?.textContent || 'Mi sitio';
  const html = generarDocumento({ titulo, bloques: state.blocks });
  const iframe = await crearIframeOculto(html);

  try {
    const canvas = await html2canvas(iframe.contentDocument.body, {
      backgroundColor: '#ffffff', scale: 0.5, width: 1200, windowWidth: 1200,
    });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;

    const url = await subirACloudinary(blob, `clientes/${clienteId()}/sitios/${siteId}`);
    await guardarMiniaturaSitio(siteId, url);
  } finally {
    iframe.remove();
  }
}
