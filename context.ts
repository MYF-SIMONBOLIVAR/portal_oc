import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export async function createContext(opts: CreateExpressContextOptions) {
  // Ignoramos tokens, cookies y validaciones.
  // Forzamos al sistema a creer que siempre eres el Admin 8.
  return {
    req: opts.req,
    res: opts.res,
    user: { 
      id: 8, 
      nit: "12345678", 
      role: "admin",
      razonSocial: "ADMINISTRADOR DE PRUEBAS" 
    },
  };
}
