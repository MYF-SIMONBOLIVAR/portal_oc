import { initTRPC, TRPCError } from "@trpc/server";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { type TrpcContext } from "./context"; // Asegúrate que context.ts esté en la raíz
import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "./const";

/**
 * 1. CONFIGURACIÓN DEL SERVIDOR
 */
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({ ctx: { user: ctx.user } });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'admin') {
    throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  }
  return next({ ctx: { user: ctx.user } });
});

/**
 * 2. CONFIGURACIÓN DEL CLIENTE (Para Home.tsx y App.tsx)
 */
// Importamos el tipo de AppRouter desde donde sea que lo hayas dejado (ahora en la raíz)
import type { AppRouter } from "./index"; 
export const trpc = createTRPCReact<AppRouter>();
