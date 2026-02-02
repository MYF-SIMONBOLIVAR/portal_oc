import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // MAPEAREMOS EL ARCHIVO DE LA RAÍZ PARA QUE PAREZCA QUE ESTÁ EN /LIB
      "@/lib/utils": path.resolve(__dirname, "./utils.ts"),
      "@": path.resolve(__dirname, "./"),
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json']
  }
});
