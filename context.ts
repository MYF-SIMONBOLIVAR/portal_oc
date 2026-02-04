import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyProviderToken } from "./auth";
import { COOKIE_NAME } from "./const";
import { sdk } from "./sdk"; 

export async function createContext(opts: CreateExpressContextOptions) {
  let user: any = null;

  try {
    // 1. Intentar leer el token de las cookies (vía estándar)
    let token = opts.req.cookies?.[COOKIE_NAME];

    // 2. SI NO EXISTE, buscarla manualmente en el string del Header Cookie
    if (!token && opts.req.headers.cookie) {
       const rawCookies = opts.req.headers.cookie.split(';');
       const target = rawCookies.find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
       if (target) {
         token = target.split('=')[1];
       }
    }

    // 3. PLAN C: Si sigue sin existir, buscar en el Header Authorization (Bearer Token)
    if (!token && opts.req.headers.authorization) {
      const parts = opts.req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    // 4. Intentar autenticar con el SDK de la plataforma
    const sdkUser = await sdk.authenticateRequest(opts.req).catch(() => null);
    
    if (sdkUser && token) {
      // 5. Decodificar nuestro JWT para obtener el ROL (admin o provider)
      const decoded = verifyProviderToken(token);
      
      // 6. Fusionar: Datos de identidad del SDK + ROL de nuestro token
      user = {
        ...sdkUser,
        role: decoded?.role || 'provider' 
      };
      
      console.log(`[Context] ✅ Usuario autenticado: ${user.nit || user.id} | Rol: ${user.role}`);
    } else if (sdkUser) {
      // Si hay SDK pero no hay token nuestro, mantenemos el usuario pero sin nuestro rol extendido
      user = sdkUser;
      console.log(`[Context] ⚠️ SDK detectado pero sin cookie/token de rol. Rol por defecto aplicado.`);
    } else {
      console.log(`[Context] ❌ Petición anónima (sin sesión válida)`);
    }

  } catch (error) {
    console.error("[Context] 🚨 Error crítico de autenticación:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
