import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
// Como está en la raíz, el import del router suele ser relativo al index del server
import type { AppRouter } from "./index"; 

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${window.location.origin}/api/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          // ESTO ES LO QUE HACE QUE EL LOGIN PERSISTA
          credentials: "include", 
        });
      },
    }),
  ],
});
