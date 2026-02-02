import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Si el archivo está en la raíz, le decimos que @/lib/utils apunta al utils de la raíz
      "@/lib/utils": path.resolve(__dirname, "./utils.ts"),
      "@": path.resolve(__dirname, "./"),
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json']
  }
});
