import { Pool } from 'pg';

// Un solo Pool reutilizado entre invocaciones (Next.js recicla el módulo
// en dev/serverless) — crear un Pool nuevo por request agotaría las
// conexiones de Neon.
const globalParaPool = globalThis;

export const pool =
  globalParaPool._kleysitesPool ||
  (globalParaPool._kleysitesPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }));

export function consultar(texto, params) {
  return pool.query(texto, params);
}
