/*
  exportar.js
  Botón "Exportar": descarga el sitio completo como ZIP (HTML por página,
  manifest.json, kleysites.json y LEEME.txt) para publicarlo a mano en
  cualquier hosting sin pasar por KleySites.
*/

import { zipSync, strToU8 } from 'fflate';
import { construirArchivosSitio } from './sitio.js';
import { mostrarAviso } from '../aviso.js';

function descargar(bytes, nombre) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function initExportar() {
  const btn = document.getElementById('btnExportar');
  const status = document.getElementById('publishStatus');

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    status.textContent = 'Preparando ZIP…';
    try {
      const { archivos, slug } = await construirArchivosSitio();
      const entradas = {};
      archivos.forEach((a) => { entradas[a.nombre] = strToU8(a.contenido); });
      descargar(zipSync(entradas, { level: 6 }), `${slug}.zip`);
    } catch (e) {
      console.error('No se pudo exportar', e);
      await mostrarAviso('No se pudo generar el ZIP. Intenta de nuevo.', 'No se pudo exportar');
    } finally {
      status.textContent = '';
      btn.disabled = false;
    }
  });
}
