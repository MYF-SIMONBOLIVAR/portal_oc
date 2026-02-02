export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Añadimos esto para asegurar que busque desde la raíz del repo
  base: "/", 
  resolve: {
    alias: {
      // Usamos path.join para mayor seguridad en Linux (Render)
      "@": path.join(__dirname, "src"),
    },
  },
  root: __dirname, // Cambiamos "." por __dirname para que sea exacto
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
