import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => {
  const isElectron = !!process.env.ELECTRON;
  const base = command === 'serve'
    ? '/' // dev server
    : isElectron
      ? './' // Electron build uses relative paths
      : '/Anime-Vault/'; // GitHub Pages absolute base

  return {
    plugins: [react()],
    base,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, '/api'),
        },
      },
    },
    build: {
      rollupOptions: {
        external: ['bcryptjs'],
      },
    },
  };
});
