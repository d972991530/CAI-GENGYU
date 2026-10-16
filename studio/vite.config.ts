import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 开发时把 /api 代理到本地后端，浏览器只与同源通信，不存在跨域
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    host: '0.0.0.0',
    proxy: { '/api': { target: `http://localhost:${process.env.PORT ?? 8787}`, changeOrigin: false } },
  },
});
