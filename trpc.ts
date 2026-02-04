import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "./routers";

export const trpc = createTRPCReact<AppRouter>();

export const client = trpc.createClient({
 // src/trpc.ts
  links: [
    httpBatchLink({
      url: "/api/trpc",
      async fetch(url, options) {
        // 🚀 CAMBIO VITAL: Usa 'providerToken', NO 'providerId'
        const token = localStorage.getItem("providerToken"); 
        
        return fetch(url, {
          ...options,
          credentials: "include",
          headers: {
            ...options.headers,
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
      },
    }),
  ],
});
