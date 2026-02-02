import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Forzamos la ruta exacta al archivo utils
      "@/lib/utils": path.resolve(__dirname, "./lib/utils.ts"), 
      "@": path.resolve(__dirname, "./"),
    },
    // Esto ayuda a Vite a probar extensiones si no las pones
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
