import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";

// SOLUCIÓN PARA EL ERROR: Recreamos __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"), // Solo un "./src"
  },
},
  // Importante para Render: asegurar que el root sea la raíz del proyecto
  root: ".", 
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
