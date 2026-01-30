import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from 'cors';

// RUTAS CORREGIDAS: Como no hay carpeta server, buscamos directo en la raíz
import { registerOAuthRoutes } from "./auth";
import { appRouter } from "./routers"; // Asegúrate de que el archivo se llame routers.ts o js
import { createContext } from "./context";
import { startScheduler } from "./scheduler";

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || "*",
    credentials: true
  }));

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  // SALVAVIDAS PARA RENDER
  if (process.env.NODE_ENV === "development") {
    // Si llegaras a subir vite.ts a la raíz, esto lo buscaría ahí
    const { setupVite } = await import("./vite"); 
    await setupVite(app, server);
  } else {
    console.log("Modo producción detectado: Ignorando Vite...");
  }

  const port = process.env.PORT || 10000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Servidor listo en puerto ${port}`);
    startScheduler();
  });
}

startServer().catch(console.error);
