/*
  importar-ui.js
  El modal "Importar": pegar/subir HTML o JSON y convertirlo en bloques
  (la conversión en sí vive en bloques.js/importar/ — esto solo es el
  cableado del modal).
*/

import { state, ETIQUETAS_ZONA } from './state.js';
import { importarContenido } from './bloques.js';
import { ErrorImportacion } from './importar/json.js';

const MENSAJES = {
  vacio: 'Pega o sube algo de HTML o JSON primero.',
  nada: 'No se encontró nada que convertir en bloques.',
  json_invalido: 'El JSON no es válido — revisa que esté completo y en formato KleySites (ver docs/formato-kleysites.md).',
  error: 'No se pudo importar. Intenta de nuevo.',
};

export function initImportarUI() {
  const modalImportar = document.getElementById('modalImportar');
  const textareaImportar = document.getElementById('textareaImportar');
  const modalImportarError = document.getElementById('modalImportarError');
  const inputArchivoHTML = document.getElementById('inputArchivoHTML');
  const btnConfirmar = document.getElementById('btnConfirmarImportar');

  function mostrarError(clave) {
    modalImportarError.textContent = MENSAJES[clave] || MENSAJES.error;
    modalImportarError.hidden = false;
  }

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

  btnConfirmar.addEventListener('click', async () => {
    const texto = textareaImportar.value.trim();
    if (!texto) { mostrarError('vacio'); return; }

    btnConfirmar.disabled = true;
    try {
      const cantidad = await importarContenido(texto);
      if (!cantidad) { mostrarError('nada'); return; }
      cerrarModalImportar();
    } catch (e) {
      console.error('No se pudo importar', e);
      mostrarError(e instanceof ErrorImportacion ? e.motivo : 'error');
    } finally {
      btnConfirmar.disabled = false;
    }
  });
}
