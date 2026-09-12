/*
  theme.js
  Claro / Oscuro / Automático. "Automático" no guarda nada (o borra lo
  guardado) y sigue la preferencia del sistema en cada carga — así el
  script inline del <head> (que evita el parpadeo) y este módulo
  coinciden sin duplicar la lógica de qué es "automático".
*/
const STORAGE_KEY = 'kley-theme';

function sistemaEsClaro() {
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

export function temaGuardado() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch (e) {
    return 'auto';
  }
}

function aplicar(pref) {
  const esClaro = pref === 'light' || (pref === 'auto' && sistemaEsClaro());
  if (esClaro) document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
}

export function elegirTema(pref) {
  try {
    if (pref === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch (e) { /* localStorage deshabilitado: el tema no persiste, no es crítico */ }
  aplicar(pref);
}

// Botón rápido del riel del editor: alterna claro/oscuro (no elige "auto").
document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    elegirTema(actual === 'light' ? 'dark' : 'light');
  });
});
