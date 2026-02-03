import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
// 1. Apuntamos directamente a los archivos index dentro de las carpetas en la raíz
import { appRouter } from "./routers"; 
import { createContext } from "./context";
// 2. Apuntamos al scheduler en la raíz
import { startScheduler } from "./scheduler";
import cookieParser from "cookie-parser";
// ...

async function startServer() {
  const app = express();
  app.use(cookieParser()); // Esto le pone los lentes al servidor para ver las cookies
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
   * Si 'vite.ts' está en la raíz junto a este index.ts, usamos './vite.ts'
   */
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite.ts");
    await setupVite(app, server);
  } else {
    const { serveStatic } = await import("./vite.ts");
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
