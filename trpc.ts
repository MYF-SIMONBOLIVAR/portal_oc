import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "./server/_core/index"; // Revisa que esta ruta sea correcta

export const trpc = createTRPCReact<AppRouter>();
