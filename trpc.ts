import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "./routers"; // Asegúrate de que esta ruta sea correcta

export const trpc = createTRPCReact<AppRouter>();

export const client = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      async fetch(url, options) {
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
