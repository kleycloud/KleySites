import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacidad: resolve(__dirname, 'privacidad.html'),
        terminos: resolve(__dirname, 'terminos.html'),
        soporte: resolve(__dirname, 'soporte.html'),
        ayuda: resolve(__dirname, 'ayuda.html'),
        editor: resolve(__dirname, 'editor.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
