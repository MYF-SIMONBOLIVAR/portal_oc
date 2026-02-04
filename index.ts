import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "./routers"; 
import { createContext } from "./context";
import { startScheduler } from "./scheduler";
import cookieParser from "cookie-parser";
import cors from "cors"; // 🚀 Importante: Necesitas instalar 'npm install cors'

async function startServer() {
  const app = express();
  
  // 1. Configuración de confianza para Proxies (Render usa uno)
  app.set("trust proxy", 1);

  // 2. Configuración de CORS (Permite que los Headers y Cookies pasen)
  app.use(cors({
    origin: true, // En producción puedes poner tu URL específica https://portal-oc.onrender.com
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    methods: ["GET", "POST", "OPTIONS"],
  }));

  // 3. Middlewares base
  app.use(cookieParser()); 
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // 4. Rutas de OAuth
  registerOAuthRoutes(app);

  // 5. Middleware de tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  /**
   * MANEJO DINÁMICO DE VITE
   */
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite.ts");
    await setupVite(app, server);
  } else {
    // Servir archivos estáticos del build de Vite
    const { serveStatic } = await import("./vite.ts");
    serveStatic(app);
  }

  const server = createServer(app);
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Servidor listo en puerto ${port}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'production'}`);
    
    startScheduler();
  });
}

startServer().catch((err) => {
  console.error("❌ Error al iniciar el servidor:", err);
});

// Manejo de señales de cierre
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM recibido, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT recibido, cerrando servidor...");
  process.exit(0);
});
