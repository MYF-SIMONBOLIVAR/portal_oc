import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "./index";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${window.location.origin}/api/trpc`,
      async headers() {
        return {
          // Puedes añadir headers personalizados aquí si los necesitas
        };
      },
      //  ESTO ES LO QUE FALTA: Permite que las cookies viajen al servidor
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
