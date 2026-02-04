import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "./index"; // Ajusta la ruta si es necesario

// 1. Solo una declaración de trpc
export const trpc = createTRPCReact<AppRouter>();

// 2. Configuración del cliente con las credenciales activadas
export const client = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/trpc', // O la URL completa si es necesario
      async fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include', // 🚀 Esta es la pieza clave para las cookies
        });
      },
    }),
  ],
});
