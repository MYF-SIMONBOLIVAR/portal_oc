import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./server/oauth.js";
import { appRouter } from "./server/routers.js";
import { createContext } from "./server/context.js";
import { startScheduler } from "./server/scheduler.js";

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  // SALVAVIDAS PARA RENDER: Ignoramos Vite
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./server/vite.js");
    await setupVite(app, server);
  } else {
    try {
      const { serveStatic } = await import("./server/vite.js");
      serveStatic(app);
    } catch (e) {
      console.log("Modo producción: Sirviendo archivos estáticos...");
    }
  }

  const port = process.env.PORT || 3000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Servidor listo en puerto ${port}`);
    startScheduler();
  });
}

startServer().catch(console.error);
