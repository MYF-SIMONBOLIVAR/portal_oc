import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
// Como está en la raíz, el import del router suele ser relativo al index del server
import type { AppRouter } from "./index"; 

export const trpc = createTRPCReact<AppRouter>();

// En tu configuración de tRPC Client (Frontend)
export const trpc = createTRPCReact<AppRouter>();

export const client = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'https://portal-oc.onrender.com/trpc',
      // 🚀 ESTO ES LO QUE FALTA:
      headers() {
        return {
          // Si usas headers manuales
        };
      },
      async fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include', // 👈 ESTA ES LA LLAVE MAESTRA
        });
      },
    }),
  ],
});
