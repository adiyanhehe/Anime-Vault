import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => {
  const isElectron = !!process.env.ELECTRON;
  // GitHub Pages is served at the root of the user page
  // (https://animevaultofficial.github.io/), so the bundle's asset URLs
  // must be relative to "/". Override with VITE_BASE / GH_PAGES_BASE if you
  // ever need to host the bundle under a sub-path again.
  const ghPagesBase = process.env.VITE_BASE || process.env.GH_PAGES_BASE || '/';
  const base = command === 'serve'
    ? '/' // dev server
    : isElectron
      ? './' // Electron build uses relative paths
      : ghPagesBase; // GitHub Pages absolute base

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
