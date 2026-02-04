import crypto from "crypto";
import { ENV } from "./env";

// Usamos el secret de las cookies para firmar nuestro token manual
const JWT_SECRET = ENV.cookieSecret;

/**
 * Hash de contraseña usando PBKDF2
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
 * Generar JWT manual para sesión de proveedor
 * Duración: 1 año para evitar cierres de sesión inesperados
 */
export function generateProviderToken(providerId: number, nit: string, role: string): string {
  console.log("[Auth] Generando token para:", nit, "role:", role);
  
  const payload = {
    id: providerId, // Unificado para que el Context lo reconozca
    nit,
    role, 
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), 
  };

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

/**
 * Verificar y decodificar JWT de proveedor
 */
export function verifyProviderToken(token: string): { id: number; nit: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString());

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: payload.id,
      nit: payload.nit,
      role: payload.role || "provider",
    };
  } catch (error) {
    console.error("[Auth] Error verificando token:", error);
    return null;
  }
}

/**
 * Generar código OTP de 6 dígitos
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validar formato de NIT colombiano
 */
export function isValidNIT(nit: string): boolean {
  const nitRegex = /^\d{5,15}$/;
  return nitRegex.test(nit.replace(/[.-]/g, ""));
}

/**
 * Generar token de verificación hexadecimal
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validar expiración de fecha
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Validar celular colombiano (10 dígitos)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ""));
}
