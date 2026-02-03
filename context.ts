import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyProviderToken } from "./auth"; // IMPORTANTE: Trae tu validador
import { COOKIE_NAME } from "./const"; // Asegúrate de tener el nombre de la cookie

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<any> {
  let user: any = null;

  try {
    // 1. El SDK hace la validación base (sesión, expiración)
    const sdkUser = await sdk.authenticateRequest(opts.req);
    
    // 2. Extraemos el rol directamente del token JWT
    const token = opts.req.cookies?.[COOKIE_NAME] || opts.req.headers.cookie;
    // Si el token viene en el header plano, podrías necesitar un parser, 
    // pero si usas cookie-parser, req.cookies es suficiente.
    
    if (sdkUser && token) {
      // Usamos tu función de auth.ts para obtener el rol real
      const decoded = verifyProviderToken(token); 
      
      user = {
        ...sdkUser,
        role: decoded?.role || 'provider' // <--- AQUÍ LE DAMOS EL PODER
      };
    } else {
      user = sdkUser;
    }
  } catch (error) {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
