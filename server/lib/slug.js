import { consultar } from './db.js';

export function slugificar(nombre) {
  return String(nombre || '')
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Si el slug base ya existe, intenta variantes antes de rendirse.
export async function slugDisponible(base) {
  const random = Math.floor(100 + Math.random() * 900);
  const candidatos = [base, `${base}-pe`, `${base}-oficial`, `${base}-${random}`, `${base}-2`];
  const { rows } = await consultar('SELECT slug FROM sites WHERE slug = ANY($1)', [candidatos]);
  const ocupados = new Set(rows.map((r) => r.slug));
  return candidatos.find((c) => !ocupados.has(c)) || `${base}-${Date.now()}`;
}
