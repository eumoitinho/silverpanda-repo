import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    fs: {
      strict: false,
    },
  },
  publicDir: 'public',
  assetsInclude: ['**/*.wav', '**/*.mp3'],
  optimizeDeps: {
    exclude: ['**/*.wav', '**/*.mp3'],
  },
});
