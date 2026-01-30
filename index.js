import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from 'cors';

// QUITAMOS las extensiones .ts para que tsx las resuelva solo
import { registerOAuthRoutes } from "./server/oauth";
import { appRouter } from "./server/routers/index"; 
import { createContext } from "./server/context";
import { startScheduler } from "./server/scheduler";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configuración de CORS para que Hostinger pueda hablar con Render
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || "*",
    credentials: true
  }));

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  // SALVAVIDAS PARA RENDER: Evitamos que busque Vite en producción
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./server/vite");
    await setupVite(app, server);
  } else {
    // En Render simplemente no hacemos nada con Vite
    console.log("Modo producción detectado: Ignorando Vite...");
  }

  const port = process.env.PORT || 10000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Servidor listo en puerto ${port}`);
    startScheduler();
  });
}

startServer().catch(console.error);
