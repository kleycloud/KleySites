// manifest.json para que el sitio exportado/publicado se pueda instalar
// como app ("Añadir a pantalla de inicio"). Los íconos apuntan al favicon
// del sitio en Cloudinary: no se empaqueta ningún binario, así ZIP y
// publicado son idénticos.
export function generarManifest({ nombre, faviconUrl }) {
  const manifest = {
    name: nombre || 'Mi sitio',
    short_name: (nombre || 'Mi sitio').slice(0, 12),
    start_url: './index.html',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: faviconUrl ? [{ src: faviconUrl, sizes: '512x512', type: 'image/png' }] : [],
  };
  return JSON.stringify(manifest, null, 2);
}
