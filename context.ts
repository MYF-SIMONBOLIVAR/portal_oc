import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyProviderToken } from "./auth";
import { COOKIE_NAME } from "./const";
import { sdk } from "./sdk"; 

export async function createContext(opts: CreateExpressContextOptions) {
  let user: any = null;

  try {
    // 1. Intentar leer el token del parser normal
    let token = opts.req.cookies?.[COOKIE_NAME];

    // 2. SI NO EXISTE, buscarla manualmente en el string del Header (Plan B)
    if (!token && opts.req.headers.cookie) {
       const rawCookies = opts.req.headers.cookie.split(';');
       const target = rawCookies.find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
       if (target) {
         token = target.split('=')[1];
       }
    }

    // 3. Intentar autenticar con el SDK
    const sdkUser = await sdk.authenticateRequest(opts.req).catch(() => null);
    
    if (sdkUser && token) {
      // 4. Decodificar el rol de nuestro JWT personalizado
      const decoded = verifyProviderToken(token);
      
      // 5. Fusionar los datos del SDK con el ROL de nuestro token
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
