import { defineConfig } from 'vite';

// base: './' so the build loads from file:// (Electron) and the Capacitor WebView.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
  server: { host: true },
});
