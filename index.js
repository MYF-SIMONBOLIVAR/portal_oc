import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from 'cors';
import path from "path";
import { fileURLToPath } from "url";

// RUTAS CORREGIDAS
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "./routers"; 
import { createContext } from "./context";
import { startScheduler } from "./scheduler";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configuración de CORS
  // CORRECCIÓN:
app.use(cors({
  origin: [
    "https://support.repuestossimonbolivar.com",
    "https://portal-oc.onrender.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Registro de rutas de API y Auth
  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  // LÓGICA DE SERVIDO DE ARCHIVOS (FRONTEND)
  if (process.env.NODE_ENV === "development") {
    // Modo Desarrollo: Vite maneja el frontend en caliente
    const { setupVite } = await import("./vite"); 
    await setupVite(app, server);
  } else {
    // Modo Producción: Servimos los archivos compilados desde la carpeta 'dist'
    console.log("Modo producción detectado: Cargando frontend estático...");
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // 1. Servir archivos estáticos (JS, CSS, Imágenes)
    // El servidor compilado vive en /dist, por lo que __dirname es /dist
    app.use(express.static(__dirname));

    // 2. Ruta comodín: Cualquier ruta que no sea API devuelve el index.html
    // Esto permite que React (Wouter) maneje las rutas del portal
    app.get("*", (req, res) => {
      const indexPath = path.resolve(__dirname, "index.html");
      res.sendFile(indexPath);
    });
  }

  const port = process.env.PORT || 10000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Servidor de Repuestos Simón Bolívar listo en puerto ${port}`);
    startScheduler();
  });
}

startServer().catch(console.error);
