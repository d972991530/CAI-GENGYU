import { defineConfig } from 'vite';

// 电脑版与手机版分开构建：vite build --mode desktop / --mode mobile
export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    outDir: mode === 'mobile' ? 'dist-mobile' : 'dist-desktop',
    chunkSizeWarningLimit: 2000,
    assetsInlineLimit: 0,
  },
  server: { host: true },
}));
