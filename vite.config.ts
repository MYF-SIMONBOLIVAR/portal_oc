import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";

// Recreamos __dirname para compatibilidad con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Forzamos a que Vite sepa que la raíz es donde está este archivo
  root: __dirname,
  base: "/",
  resolve: {
    alias: {
      // Usamos path.resolve para una ruta absoluta limpia hacia src
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Ayuda a debugear si hay errores de rutas en los assets
    assetsDir: "assets",
  },
});
