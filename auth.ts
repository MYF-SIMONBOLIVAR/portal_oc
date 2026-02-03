import crypto from "crypto";
import { ENV } from "./env";

/**
 * Hash de contraseña usando PBKDF2 (compatible con Node.js estándar)
 * En producción, considera usar bcrypt o argon2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verificar contraseña contra hash almacenado
 */
export function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, storedHash] = hash.split(":");
    const computedHash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, "sha512")
      .toString("hex");
    return computedHash === storedHash;
  } catch (error) {
    return false;
  }
}

/**
 * Generar JWT simple para sesión de proveedor
 * En producción, usar una librería como jsonwebtoken
 */
export function generateProviderToken(providerId: number, nit: string, role: string): string {
  console.log("[Auth] Generando token para providerId:", providerId, "nit:", nit, "role:", role);
  
  const payload = {
    providerId,
    nit,
    role, // <--- AHORA EL TOKEN SABRÁ QUE ERES ADMIN
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
  };

  // Crear un token basado en HMAC (Igual que antes)
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ENV.cookieSecret)
    .update(`${header}.${body}`)
    .digest("base64url");

  const finalToken = `${header}.${body}.${signature}`;
  console.log("[Auth] Token generado con rol exitosamente");
  return finalToken;
}

/**
 * Verificar y decodificar JWT de proveedor
 */
export function verifyProviderToken(token: string): { providerId: number; nit: string; role: string } | null { // <--- Agregamos role al tipo de retorno
  try {
    const [header, body, signature] = token.split(".");

    const expectedSignature = crypto
      .createHmac("sha256", ENV.cookieSecret)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString());

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    // AHORA DEVOLVEMOS EL ROL TAMBIÉN
    return {
      providerId: payload.providerId,
      nit: payload.nit,
      role: payload.role || "provider", // Si no tiene rol, asumimos que es un proveedor por seguridad
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generar código OTP de 6 dígitos para verificación
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validar formato de NIT colombiano (básico)
 */
export function isValidNIT(nit: string): boolean {
  // NIT debe ser numérico y tener entre 5 y 15 caracteres
  const nitRegex = /^\d{5,15}$/;
  return nitRegex.test(nit.replace(/[.-]/g, ""));
}


/**
 * Generar token de verificación para registro o reset de contraseña
 * Token válido por 24 horas
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validar que un token no haya expirado
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}


/**
 * Validar formato de celular colombiano (10 dígitos)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Celular debe ser numérico y tener exactamente 10 dígitos
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ""));
}
