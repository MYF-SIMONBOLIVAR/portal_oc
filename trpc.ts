import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "./index"; // Asegúrate de que apunte a tu archivo donde está el AppRouter

export const trpc = createTRPCReact<AppRouter>();
