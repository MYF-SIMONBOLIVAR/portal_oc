import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// USA LA EXTENSIÓN .ts EXPLÍCITAMENTE
import { registerOAuthRoutes } from "./server/oauth.ts";
import { appRouter } from "./server/routers/index.ts"; 
import { createContext } from "./server/context.ts";
import { startScheduler } from "./server/scheduler.ts";



async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configuración de límites para subida de archivos
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Rutas de OAuth
  registerOAuthRoutes(app);

  // API tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  /**
   * MANEJO DINÁMICO DE VITE
   * Evita que Render busque la librería 'vite' en producción.
   */
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    const { serveStatic } = await import("./vite");
    serveStatic(app);
  }

  // Definición del puerto: Prioridad a Render
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Inicio del servidor UNIFICADO
  // Usamos "0.0.0.0" para que Render pueda ver el portal de Simón Bolívar
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Servidor listo en puerto ${port}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    // Iniciar scheduler de sincronización Siesa
    startScheduler();
  });
}

// ARRANQUE DE LA APP
startServer().catch((err) => {
  console.error("❌ Error al iniciar el servidor:", err);
});

/**
 * CIERRE SEGURO (Graceful Shutdown)
 * Lo que me pediste para que Render cierre bien los procesos
 */
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM recibido, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT recibido, cerrando servidor...");
  process.exit(0);
});
