import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GEMINI_API_KEY 只由后端（server/index.ts）读取，不再注入前端包。
// 开发时 /api 代理到本地后端，浏览器只与同源通信，不存在跨域。
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: { '/api': `http://localhost:${process.env.PORT ?? 8788}` },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
