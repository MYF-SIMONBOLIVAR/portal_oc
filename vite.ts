import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url"; // Añadido para manejar rutas en ESM
import { createServer as createViteServer } from "vite";
import viteConfig from "./vite.config";

// Configuración de rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Ajustado: busca index.html directamente en la raíz o carpeta client
      const clientTemplate = path.resolve(__dirname, "index.html");

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // AJUSTE: Vite genera 'dist' en la raíz. 
  // Al estar este archivo en la raíz, la ruta es directa.
  const distPath = path.resolve(__dirname, "dist");

  if (!fs.existsSync(distPath)) {
    console.error(
      `❌ Carpeta de build no encontrada en: ${distPath}`
    );
  }

  // Servir archivos estáticos desde /dist
  app.use(express.static(distPath));

  // Cualquier otra ruta debe devolver el index.html de /dist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Error: No se encontró el index.html en /dist");
    }
  });
}
