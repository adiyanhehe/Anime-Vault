import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => {
  // For the Electron build we MUST use relative paths ('./') so that
  // file:///…/dist/index.html can find its assets.
  // For the GitHub Pages deploy we use '/Anime-Vault/'.
  const isElectron = !!process.env.ELECTRON;
  const base = command === 'serve'
    ? '/'                       // dev server
    : isElectron
      ? './'                    // electron production build
      : '/Anime-Vault/';       // GitHub Pages

  return {
    build: {
    rollupOptions: {
      external: ['bcryptjs']
    }
  },
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
  };
});
