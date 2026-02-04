import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "./routers";

export const trpc = createTRPCReact<AppRouter>();

export const client = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      async fetch(url, options) {
        // 🚀 FORZAMOS LA LECTURA DIRECTA
        const token = window.localStorage.getItem("providerToken");
        
        const modifiedOptions = {
          ...options,
          credentials: "include" as const,
          headers: {
            ...options.headers,
            // Si hay token, lo mandamos. Si no, mandamos string vacío.
            "Authorization": token ? `Bearer ${token}` : "",
          },
        };
        
        console.log("[tRPC Client] Enviando petición con token:", !!token);
        return fetch(url, modifiedOptions);
      },
    }),
  ],
});
