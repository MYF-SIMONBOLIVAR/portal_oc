import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
    // Esto es lo que falta: le dice a Vite que busque el archivo con estas extensiones
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.css']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Evita que el build falle por advertencias menores
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    }
  }
});
