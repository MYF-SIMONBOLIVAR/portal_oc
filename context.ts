import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyProviderToken } from "./auth";
import { COOKIE_NAME } from "./const";
import { sdk } from "./sdk"; // No olvides re-importar tu SDK

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<any> {
  let user: any = null;

  try {
    // 1. Intentar autenticar con el SDK
    const sdkUser = await sdk.authenticateRequest(opts.req);
    
    // 2. Extraer el token de las cookies de forma segura
    // Usamos opts.req.cookies (si tienes cookie-parser) o parseamos el header
    const token = opts.req.cookies?.[COOKIE_NAME];

    if (sdkUser && token) {
      // 3. Decodificar el rol de nuestro JWT personalizado
      const decoded = verifyProviderToken(token);
      
      // 4. Fusionar los datos del SDK con el ROL de nuestro token
      user = {
        ...sdkUser,
        role: decoded?.role || 'provider' 
      };
      
      console.log(`[Context] Usuario identificado: ${user.nit} con rol: ${user.role}`);
    } else {
      user = sdkUser;
    }
  } catch (error) {
    console.error("[Context] Error de autenticación:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
