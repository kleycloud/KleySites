// blake3-wasm no tiene un build pensado para bundlers de Workers: su
// entrada "browser" espera que el wasm se cargue por separado (fetch), y
// su entrada "node" usa `fs.readFileSync`, que no existe en Workers. La
// forma que sí funciona: importar el .wasm compilado directo como módulo
// ES (algo que wrangler soporta nativo) y pasárselo al loader
// "browser-async" del propio paquete en vez de dejarlo buscarlo solo.
import wasmModule from 'blake3-wasm/dist/wasm/web/blake3_js_bg.wasm';
import load from 'blake3-wasm/browser-async';

const blake3 = await load(wasmModule);

// Receta exacta que usa Wrangler para el manifest de Cloudflare Pages
// (verificada leyendo su código fuente, no es un hash cualquiera):
// blake3(base64(contenido) + extensión-sin-punto).hex().slice(0, 32).
export function hashArchivo(contenidoUtf8, nombreArchivo) {
  const base64 = Buffer.from(contenidoUtf8, 'utf8').toString('base64');
  const ext = nombreArchivo.includes('.') ? nombreArchivo.split('.').pop() : '';
  return blake3.hash(base64 + ext).toString('hex').slice(0, 32);
}
