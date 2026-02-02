import { defineConfig } from "vite"; // 👈 ESTA ES LA LÍNEA QUE FALTA
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";

// SOLUCIÓN PARA EL ERROR: Recreamos __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/", 
  resolve: {
    alias: {
      "@": path.join(__dirname, "src"),
    },
  },
  root: __dirname, 
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
