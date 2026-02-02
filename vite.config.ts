import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";

// SOLUCIÓN PARA EL ERROR: __dirname no existe en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@db": path.resolve(__dirname, "./db"),
    },
  },
  root: ".", // Asegura que Vite busque el index.html en la raíz
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
