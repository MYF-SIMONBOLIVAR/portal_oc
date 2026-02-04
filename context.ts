import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyProviderToken } from "./auth";
import { COOKIE_NAME } from "./const";
import { sdk } from "./sdk"; 

export async function createContext(opts: CreateExpressContextOptions) {
  const { req, res } = opts;
  let user: any = null;

  try {
    // 1. Extraer el token de cualquier fuente (Cookies, Header manual o Authorization)
    let token = req.cookies?.[COOKIE_NAME];

    if (!token && req.headers.cookie) {
       const target = req.headers.cookie.split(';').find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
       if (target) token = target.split('=')[1];
    }

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    // 2. Intentar autenticar con el SDK de la plataforma (Opcional)
    const sdkUser = await sdk.authenticateRequest(req).catch(() => null);
    
    // 3. Validar nuestro propio Token (Independiente del SDK)
    const myDecodedToken = token ? verifyProviderToken(token) : null;

    if (sdkUser) {
      // Caso A: El SDK funciona, le inyectamos nuestro rol
      user = {
        ...sdkUser,
        role: myDecodedToken?.role || 'provider' 
      };
      console.log(`[Context] ✅ SDK Autenticado: ${user.nit || user.id} | Rol: ${user.role}`);
    } 
    else if (myDecodedToken) {
      // Caso B: EL SDK FALLÓ (Bypass), pero nuestro JWT es válido
      // Reconstruimos el usuario con la data de nuestro token para no depender del SDK
      user = {
        id: myDecodedToken.id,
        nit: myDecodedToken.nit,
        role: myDecodedToken.role,
        razonSocial: "Proveedor Autenticado",
        email: "", 
        isBypass: true // Marcador interno para saber que entró por JWT propio
      };
      console.log(`[Context] 🛡️ Bypass SDK: Usando JWT propio para ${user.nit} | Rol: ${user.role}`);
    } else {
      console.log(`[Context] ❌ Petición anónima (Sin cookie ni header válido)`);
    }

  } catch (error) {
    console.error("[Context] 🚨 Error crítico de autenticación:", error);
    user = null;
  }

  return {
    req,
    res,
    user,
  };
}
