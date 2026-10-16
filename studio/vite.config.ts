import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5180, host: '0.0.0.0' },
    define: {
      // 可选：构建时注入默认 Key；也可以在应用「设置」里填写
      __DEFAULT_GEMINI_KEY__: JSON.stringify(env.GEMINI_API_KEY ?? ''),
    },
  };
});
