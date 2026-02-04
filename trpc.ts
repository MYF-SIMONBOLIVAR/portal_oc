import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "./routers";

export const trpc = createTRPCReact<AppRouter>();

export const client = trpc.createClient({
 // src/trpc.ts
  links: [
    httpBatchLink({
      url: "/api/trpc",
      async fetch(url, options) {
      const token = localStorage.getItem("providerToken"); // 👈 DEBE SER ESTE NOMBRE
      return fetch(url, {
       ...options,
       credentials: "include",
       headers: {
         ...options.headers,
         Authorization: token ? `Bearer ${token}` : "", // 👈 ESTO MANDA EL TOKEN
         },
       });
     }
    }),
  ],
});
