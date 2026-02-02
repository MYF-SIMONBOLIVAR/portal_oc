import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
// 1. Antes "../routers", ahora entramos a la carpeta server
import { appRouter } from "./routers"; 
import { createContext } from "./context";
// 2. Antes "../scheduler", ahora entramos a la carpeta server
import { startScheduler } from "./scheduler"; 

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  /**
   * MANEJO DINÁMICO DE VITE
   * 3. Ajustamos las rutas de importación de './vite' a './server/_core/vite'
   */
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    const { serveStatic } = await import("./vite");
    serveStatic(app);
  }

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Servidor listo en puerto ${port}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    startScheduler();
  });
}

startServer().catch((err) => {
  console.error("❌ Error al iniciar el servidor:", err);
});

process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM recibido, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT recibido, cerrando servidor...");
  process.exit(0);
});
