import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "./index"; // Ajusta la ruta si es necesario

// 1. Solo una declaración de trpc
export const trpc = createTRPCReact<AppRouter>();

// 2. Configuración del cliente con las credenciales activadas
export const client = trpc.createClient({
  links: [
    httpBatchLink({
    url: "/api/trpc",
    async fetch(url, options) {
      const token = localStorage.getItem("providerToken");
      return fetch(url, {
        ...options,
        credentials: "include", // Para cookies (si funcionan)
        headers: {
          ...options.headers,
          Authorization: token ? `Bearer ${token}` : "", // Para bypass (Plan B)
        },
      });
    },
  }),
