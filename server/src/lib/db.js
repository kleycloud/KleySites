import { Client } from 'pg';

// En Vercel había un solo Pool de `pg` reciclado entre invocaciones. En
// Workers cada request es su propio aislado y el binding de Hyperdrive
// (env.HYPERDRIVE) solo existe dentro del handler — no se puede abrir la
// conexión a nivel de módulo como antes. En vez de abrir una conexión por
// cada llamada a consultar() (varias rutas hacen 2-3 consultas seguidas),
// un middleware en index.js abre UN Client por request, lo cuelga del
// contexto de Hono, y lo cierra al terminar — consultar() solo lo reusa.
export async function crearClienteDB(env) {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await client.connect();
  return client;
}

export function consultar(c, texto, params) {
  return c.get('db').query(texto, params);
}
