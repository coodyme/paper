import { defineConfig } from 'vite'

export default defineConfig({
  root: 'client',
  server:{
    allowedHosts: true,
  },
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