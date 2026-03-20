import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/AquaVend3.0/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
});