import { defineConfig } from 'vite'

export default defineConfig({
  root: 'client',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': '/client',
    },
  },
})