import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { ENV } from "./env";
import { eq, desc, and, gte, lte } from "drizzle-orm"; // Asegúrate de importar estos helpers

// Definición de tipos basada en tu esquema (ajustar si es necesario)
import { users, providers, purchaseOrders, attachments, orderItems, confirmations, syncLogs, kpiSnapshots, verificationTokens } from "./schema";

let _pool: mysql.Pool | null = null;
let _db: any = null;

export async function getDb() {
  if (!_db) {
    if (!ENV.databaseUrl) {
      throw new Error("DATABASE_URL no configurada en las variables de entorno");
    }

    try {
      // Creamos un Pool en lugar de una conexión única para manejar reconexiones automáticas
      _pool = mysql.createPool({
        uri: ENV.databaseUrl,
        waitForConnections: true,
        connectionLimit: 10, // Máximo de conexiones simultáneas
        queueLimit: 0,
        enableKeepAlive: true, // Mantiene la conexión activa con Hostinger
        keepAliveInitialDelay: 10000, // Envía señal cada 10 seg
      });

      _db = drizzle(_pool, { schema, mode: "default" });
      console.log("✅ [Database] Pool de conexiones establecido exitosamente");
    } catch (error) {
      console.error("❌ [Database] Error al crear el Pool:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: any): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  try {
    const values: any = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;

    textFields.forEach(field => {
      if (user[field] !== undefined) {
        values[field] = user[field] ?? null;
        updateSet[field] = user[field] ?? null;
      }
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * PROVIDER QUERIES
 */

export async function getProviderByNit(nit: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get provider: database not available");
    return undefined;
  }

  const result = await db.select().from(providers).where(eq(providers.nit, nit)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProviderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(providers).where(eq(providers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProvider(data: {
  nit: string;
  razonSocial: string;
  email: string;
  celular: string;
  passwordHash: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(providers).values(data);
  return getProviderByNit(data.nit);
}

/**
 * PURCHASE ORDER QUERIES
 */

export async function getProviderOrders(providerId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.providerId, providerId))
    .orderBy(desc(purchaseOrders.fecha))
    .limit(limit)
    .offset(offset);
}

export async function getOrdersByDateRange(providerId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.providerId, providerId),
        gte(purchaseOrders.fecha, startDate),
        lte(purchaseOrders.fecha, endDate)
      )
    )
    .orderBy(desc(purchaseOrders.fecha));
}

export async function getAllOrders(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrders)
    .orderBy(desc(purchaseOrders.fecha))
    .limit(limit)
    .offset(offset);
}

export async function getOrdersByProviderAndDate(providerId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.providerId, providerId),
        gte(purchaseOrders.fecha, startDate),
        lte(purchaseOrders.fecha, endDate)
      )
    )
    .orderBy(desc(purchaseOrders.fecha));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrderStatus(id: number, estadoOrden: "pendiente" | "confirmada" | "rechazada") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(purchaseOrders)
    .set({ estadoOrden, updatedAt: new Date() })
    .where(eq(purchaseOrders.id, id));

  return getOrderById(id);
}

export async function upsertPurchaseOrder(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.siesa_id) {
    const existing = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.siesa_id, data.siesa_id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(purchaseOrders)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(purchaseOrders.siesa_id, data.siesa_id));
      return existing[0];
    }
  }

  await db.insert(purchaseOrders).values(data);
  return getOrderById(data.id);
}

/**
 * ATTACHMENT QUERIES
 */

export async function getOrderAttachments(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(attachments)
    .where(eq(attachments.purchaseOrderId, purchaseOrderId));
}

export async function getOrderItems(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.purchaseOrderId, purchaseOrderId));
}

export async function createAttachment(data: {
  purchaseOrderId: number;
  tipoArchivo: "factura" | "guia_despacho";
  nombreArchivo: string;
  s3Key: string;
  s3Url: string;
  mimeType?: string;
  tamaño?: number;
  uploadedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(attachments).values(data);
  return result;
}

/**
 * CONFIRMATION QUERIES
 */

export async function createConfirmation(data: {
  purchaseOrderId: number;
  providerId: number;
  estadoAnterior?: "pendiente" | "confirmada" | "rechazada";
  estadoNuevo: "pendiente" | "confirmada" | "rechazada";
  razonRechazo?: string;
  confirmedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(confirmations).values(data as any);
}

export async function getOrderConfirmationHistory(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(confirmations)
    .where(eq(confirmations.purchaseOrderId, purchaseOrderId))
    .orderBy(desc(confirmations.confirmedAt));
}

/**
 * SYNC LOG QUERIES
 */

export async function createSyncLog(data: {
  syncStartedAt: Date;
  status: string;
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  errorMessage?: string;
  nextSyncScheduledFor?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(syncLogs).values(data as any);
}

export async function updateSyncLog(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(syncLogs).set(data).where(eq(syncLogs.id, id));
}

export async function getLastSyncLog() {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(syncLogs)
    .orderBy(desc(syncLogs.syncStartedAt))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * KPI QUERIES
 */

export async function createKpiSnapshot(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(kpiSnapshots).values(data);
}

export async function getKpiSnapshot(date: Date) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(kpiSnapshots)
    .where(eq(kpiSnapshots.snapshotDate, date))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getLatestKpiSnapshot() {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(kpiSnapshots)
    .orderBy(desc(kpiSnapshots.snapshotDate))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}


/**
 * VERIFICATION TOKEN QUERIES
 */

export async function createVerificationToken(data: InsertVerificationToken) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(verificationTokens).values(data);
}

export async function getVerificationTokenByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function markTokenAsUsed(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(verificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(verificationTokens.token, token));
}

export async function getProviderByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(providers)
    .where(eq(providers.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateProviderPassword(providerId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(providers)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(providers.id, providerId));
}

export async function getAllProviders() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get providers: database not available");
    return [];
  }

  try {
    const result = await db.select().from(providers).orderBy(providers.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get all providers:", error);
    return [];
  }
}

export async function updateProvider(providerId: number, data: {
  razonSocial?: string;
  email?: string;
  celular?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
  estado?: "activo" | "inactivo";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = { ...data, updatedAt: new Date() };
  
  await db
    .update(providers)
    .set(updateData)
    .where(eq(providers.id, providerId));
  
  return getProviderById(providerId);
}

export async function deleteProvider(providerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Soft delete: marcar como inactivo
  await db
    .update(providers)
    .set({ estado: "inactivo", updatedAt: new Date() })
    .where(eq(providers.id, providerId));
}


export async function updateOrderGuiaAndFactura(
  orderId: number,
  numeroGuia: string | null,
  numeroFactura: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(purchaseOrders)
    .set({
      numeroGuia: numeroGuia || null,
      numeroFactura: numeroFactura || null,
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, orderId));

  return getOrderById(orderId);
}
