/** @type {import('next').NextConfig} */
const ALLOWED_ORIGIN = process.env.KLEYSITES_FRONTEND_ORIGIN || '*';

const nextConfig = {
  // El tracer de Next.js no detecta la dependencia de Wrangler porque se
  // invoca con un path armado en runtime (child_process), no un
  // import/require estático — sin esto, Vercel no empaqueta el paquete
  // y `publish` falla con ENOENT.
  outputFileTracingIncludes: {
    // wrangler carga módulos (miniflare, workerd, etc.) que el tracer no
    // detecta por ser requires dinámicos dentro de su propio CLI — se
    // incluye node_modules entero para esta ruta en vez de perseguir cada
    // dependencia transitiva una por una.
    '/api/kleysites/publish': ['./node_modules/**'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: ALLOWED_ORIGIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
