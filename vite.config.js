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
        editor: resolve(__dirname, 'editor.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
