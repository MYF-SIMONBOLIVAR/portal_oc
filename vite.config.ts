import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Esto le dice a Vite: "Cuando veas @, busca en la carpeta raíz"
      "@": path.resolve(__dirname, "./"),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
