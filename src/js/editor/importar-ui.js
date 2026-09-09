/*
  importar-ui.js
  El modal "Importar": pegar/subir HTML o JSON y convertirlo en bloques
  (la conversión en sí vive en bloques.js/importar.js — esto solo es el
  cableado del modal).
*/

import { state, ETIQUETAS_ZONA } from './state.js';
import { importarContenido } from './bloques.js';

export function initImportarUI() {
  const modalImportar = document.getElementById('modalImportar');
  const textareaImportar = document.getElementById('textareaImportar');
  const modalImportarError = document.getElementById('modalImportarError');
  const inputArchivoHTML = document.getElementById('inputArchivoHTML');

  function abrirModalImportar() {
    document.getElementById('modalZonaNombre').textContent = ETIQUETAS_ZONA[state.zonaActiva] || state.zonaActiva;
    textareaImportar.value = '';
    modalImportarError.hidden = true;
    modalImportar.classList.add('is-open');
    textareaImportar.focus();
  }

  function cerrarModalImportar() {
    modalImportar.classList.remove('is-open');
  }

  document.getElementById('btnImportar').addEventListener('click', abrirModalImportar);
  document.getElementById('btnCerrarImportar').addEventListener('click', cerrarModalImportar);
  document.getElementById('btnCancelarImportar').addEventListener('click', cerrarModalImportar);
  modalImportar.addEventListener('click', (e) => {
    if (e.target === modalImportar) cerrarModalImportar();
  });

  document.getElementById('btnSubirArchivo').addEventListener('click', () => inputArchivoHTML.click());
  inputArchivoHTML.addEventListener('change', async () => {
    const archivo = inputArchivoHTML.files[0];
    if (!archivo) return;
    textareaImportar.value = await archivo.text();
    inputArchivoHTML.value = '';
  });

  document.getElementById('btnConfirmarImportar').addEventListener('click', () => {
    const texto = textareaImportar.value.trim();
    if (!texto) {
      modalImportarError.textContent = 'Pega o sube algo de HTML o JSON primero.';
      modalImportarError.hidden = false;
      return;
    }
    const huboBloques = importarContenido(texto);
    if (!huboBloques) {
      modalImportarError.textContent = 'No se encontró nada que convertir en bloques.';
      modalImportarError.hidden = false;
      return;
    }
    cerrarModalImportar();
  });
}
