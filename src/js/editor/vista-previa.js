/*
  vista-previa.js
  Botón "Vista previa": el estado actual del lienzo (aunque no se haya
  guardado todavía) como HTML final, en una pestaña nueva. Usa el mismo
  generador que Exportar y Publicar, así lo que se ve es lo que sale.
*/

import { state } from './state.js';
import { generarDocumento } from '../render/documento.js';
import { obtenerPlan } from './sitio.js';

export function initVistaPrevia() {
  document.getElementById('btnVistaPrevia').addEventListener('click', async () => {
    // Se abre la pestaña primero, sincrónico con el clic — si se espera a
    // obtener el plan antes de abrir, algunos navegadores (Safari sobre
    // todo) bloquean la ventana por no verla como resultado directo del clic.
    const popup = window.open('', '_blank');
    const plan = await obtenerPlan();
    const html = generarDocumento({
      titulo: document.getElementById('siteName').textContent,
      bloques: state.blocks,
      badge: plan !== 'pro',
    });
    if (popup) {
      popup.document.write(html);
      popup.document.close();
    }
  });
}
