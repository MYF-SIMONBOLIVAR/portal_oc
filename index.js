var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, longtext } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
var users, providers, purchaseOrders, orderItems, attachments, confirmations, syncLogs, verificationTokens, kpiSnapshots, providersRelations, purchaseOrdersRelations, orderItemsRelations, attachmentsRelations, confirmationsRelations;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    providers = mysqlTable("providers", {
      id: int("id").autoincrement().primaryKey(),
      nit: varchar("nit", { length: 20 }).notNull().unique(),
      razonSocial: varchar("razonSocial", { length: 255 }).notNull(),
      email: varchar("email", { length: 255 }).notNull(),
      celular: varchar("celular", { length: 10 }).notNull(),
      telefono: varchar("telefono", { length: 20 }),
      ciudad: varchar("ciudad", { length: 100 }),
      direccion: varchar("direccion", { length: 255 }),
      passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
      estado: mysqlEnum("estado", ["activo", "inactivo"]).default("activo").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    purchaseOrders = mysqlTable("purchaseOrders", {
      id: int("id").autoincrement().primaryKey(),
      // FIX: .nullable() antes de .unique() para evitar conflictos de tipos y duplicados vacíos
      siesaId: varchar("siesa_id", { length: 255 }).unique(),
      providerId: int("providerId").notNull(),
      tipoDocumento: varchar("tipoDocumento", { length: 20 }),
      consecutivo: varchar("consecutivo", { length: 50 }).notNull(),
      fecha: date("fecha").notNull(),
      ciudad: varchar("ciudad", { length: 100 }),
      referencia: varchar("referencia", { length: 255 }),
      descripcion: longtext("descripcion"),
      cantidad: decimal("cantidad", { precision: 10, scale: 2 }),
      precioUnitario: decimal("precioUnitario", { precision: 12, scale: 2 }),
      valorBruto: decimal("valorBruto", { precision: 12, scale: 2 }),
      descuentoGlobal: decimal("descuentoGlobal", { precision: 12, scale: 2 }).default("0"),
      subtotal: decimal("subtotal", { precision: 12, scale: 2 }),
      impuestos: decimal("impuestos", { precision: 12, scale: 2 }),
      valorTotal: decimal("valorTotal", { precision: 12, scale: 2 }),
      notas: longtext("notas"),
      estadoOrden: mysqlEnum("estadoOrden", ["pendiente", "confirmada", "rechazada"]).default("pendiente").notNull(),
      estadoEntrega: mysqlEnum("estadoEntrega", ["no_entregada", "entregada", "parcial"]).default("no_entregada").notNull(),
      fechaEstimadaEntrega: date("fechaEstimadaEntrega"),
      numeroGuia: varchar("numeroGuia", { length: 255 }),
      numeroFactura: varchar("numeroFactura", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      notificadoWpp: int("notificado_wpp").default(0).notNull(),
      fechaNotificacionWpp: timestamp("fecha_notificacion_wpp")
    });
    orderItems = mysqlTable("orderItems", {
      id: int("id").autoincrement().primaryKey(),
      purchaseOrderId: int("purchaseOrderId").notNull(),
      referencia: varchar("referencia", { length: 100 }).notNull(),
      descripcion: longtext("descripcion").notNull(),
      cantidad: decimal("cantidad", { precision: 10, scale: 2 }).notNull(),
      precioUnitario: decimal("precioUnitario", { precision: 12, scale: 2 }).notNull(),
      impuestos: decimal("impuestos", { precision: 12, scale: 2 }).notNull(),
      valorTotal: decimal("valorTotal", { precision: 12, scale: 2 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    attachments = mysqlTable("attachments", {
      id: int("id").autoincrement().primaryKey(),
      purchaseOrderId: int("purchaseOrderId").notNull(),
      tipoArchivo: mysqlEnum("tipoArchivo", ["factura", "guia_despacho"]).notNull(),
      nombreArchivo: varchar("nombreArchivo", { length: 255 }).notNull(),
      s3Key: varchar("s3Key", { length: 500 }).notNull(),
      s3Url: varchar("s3Url", { length: 1e3 }).notNull(),
      mimeType: varchar("mimeType", { length: 50 }),
      tama\u00F1o: int("tama\xF1o"),
      uploadedBy: int("uploadedBy").notNull(),
      uploadedAt: timestamp("uploadedAt").defaultNow().notNull()
    });
    confirmations = mysqlTable("confirmations", {
      id: int("id").autoincrement().primaryKey(),
      purchaseOrderId: int("purchaseOrderId").notNull(),
      providerId: int("providerId").notNull(),
      estadoAnterior: mysqlEnum("estadoAnterior", ["pendiente", "confirmada", "rechazada"]),
      estadoNuevo: mysqlEnum("estadoNuevo", ["pendiente", "confirmada", "rechazada"]).notNull(),
      razonRechazo: longtext("razonRechazo"),
      confirmedAt: timestamp("confirmedAt").notNull(),
      ipAddress: varchar("ipAddress", { length: 45 }),
      userAgent: varchar("userAgent", { length: 500 })
    });
    syncLogs = mysqlTable("syncLogs", {
      id: int("id").autoincrement().primaryKey(),
      syncStartedAt: timestamp("syncStartedAt").notNull(),
      syncEndedAt: timestamp("syncEndedAt"),
      status: mysqlEnum("status", ["en_progreso", "exitosa", "fallida"]).notNull(),
      recordsProcessed: int("recordsProcessed").default(0),
      recordsCreated: int("recordsCreated").default(0),
      recordsUpdated: int("recordsUpdated").default(0),
      errorMessage: longtext("errorMessage"),
      nextSyncScheduledFor: timestamp("nextSyncScheduledFor")
    });
    verificationTokens = mysqlTable("verificationTokens", {
      id: int("id").autoincrement().primaryKey(),
      nit: varchar("nit", { length: 20 }).notNull(),
      email: varchar("email", { length: 255 }).notNull(),
      celular: varchar("celular", { length: 10 }).notNull(),
      token: varchar("token", { length: 255 }).notNull().unique(),
      tokenType: mysqlEnum("tokenType", ["email_verification", "password_reset"]).notNull(),
      expiresAt: timestamp("expiresAt").notNull(),
      usedAt: timestamp("usedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    kpiSnapshots = mysqlTable("kpiSnapshots", {
      id: int("id").autoincrement().primaryKey(),
      snapshotDate: date("snapshotDate").notNull(),
      totalOrders: int("totalOrders").default(0),
      confirmedOrders: int("confirmedOrders").default(0),
      pendingOrders: int("pendingOrders").default(0),
      rejectedOrders: int("rejectedOrders").default(0),
      avgConfirmationTime: decimal("avgConfirmationTime", { precision: 10, scale: 2 }),
      deliveredOrders: int("deliveredOrders").default(0),
      partialDeliveries: int("partialDeliveries").default(0),
      topProviderByVolume: varchar("topProviderByVolume", { length: 255 }),
      topProviderVolume: decimal("topProviderVolume", { precision: 12, scale: 2 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    providersRelations = relations(providers, ({ many }) => ({
      purchaseOrders: many(purchaseOrders),
      attachments: many(attachments),
      confirmations: many(confirmations)
    }));
    purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
      provider: one(providers, {
        fields: [purchaseOrders.providerId],
        references: [providers.id]
      }),
      items: many(orderItems),
      attachments: many(attachments),
      confirmations: many(confirmations)
    }));
    orderItemsRelations = relations(orderItems, ({ one }) => ({
      purchaseOrder: one(purchaseOrders, {
        fields: [orderItems.purchaseOrderId],
        references: [purchaseOrders.id]
      })
    }));
    attachmentsRelations = relations(attachments, ({ one }) => ({
      purchaseOrder: one(purchaseOrders, {
        fields: [attachments.purchaseOrderId],
        references: [purchaseOrders.id]
      }),
      uploadedByProvider: one(providers, {
        fields: [attachments.uploadedBy],
        references: [providers.id]
      })
    }));
    confirmationsRelations = relations(confirmations, ({ one }) => ({
      purchaseOrder: one(purchaseOrders, {
        fields: [confirmations.purchaseOrderId],
        references: [purchaseOrders.id]
      }),
      provider: one(providers, {
        fields: [confirmations.providerId],
        references: [providers.id]
      })
    }));
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      siesaApiUrl: process.env.SIESA_API_URL ?? "",
      siesaConniKey: process.env.SIESA_CONNI_KEY ?? "",
      siesaConniToken: process.env.SIESA_CONNI_TOKEN ?? "",
      emailFrom: process.env.EMAIL_FROM ?? "",
      emailPassword: process.env.EMAIL_PASSWORD ?? "",
      whatsappApiUrl: process.env.WHATSAPP_API_URL ?? "",
      whatsappApiToken: process.env.WHATSAPP_API_TOKEN ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  createAttachment: () => createAttachment,
  createConfirmation: () => createConfirmation,
  createKpiSnapshot: () => createKpiSnapshot,
  createProvider: () => createProvider,
  createSyncLog: () => createSyncLog,
  createVerificationToken: () => createVerificationToken,
  deleteProvider: () => deleteProvider,
  getAllOrders: () => getAllOrders,
  getAllProviders: () => getAllProviders,
  getDb: () => getDb,
  getKpiSnapshot: () => getKpiSnapshot,
  getLastSyncLog: () => getLastSyncLog,
  getLatestKpiSnapshot: () => getLatestKpiSnapshot,
  getOrderAttachments: () => getOrderAttachments,
  getOrderById: () => getOrderById,
  getOrderConfirmationHistory: () => getOrderConfirmationHistory,
  getOrderItems: () => getOrderItems,
  getOrdersByDateRange: () => getOrdersByDateRange,
  getOrdersByProviderAndDate: () => getOrdersByProviderAndDate,
  getProviderByEmail: () => getProviderByEmail,
  getProviderById: () => getProviderById,
  getProviderByNit: () => getProviderByNit,
  getProviderOrders: () => getProviderOrders,
  getUserByOpenId: () => getUserByOpenId,
  getVerificationTokenByToken: () => getVerificationTokenByToken,
  markTokenAsUsed: () => markTokenAsUsed,
  updateOrderGuiaAndFactura: () => updateOrderGuiaAndFactura,
  updateOrderStatus: () => updateOrderStatus,
  updateProvider: () => updateProvider,
  updateProviderPassword: () => updateProviderPassword,
  updateSyncLog: () => updateSyncLog,
  upsertPurchaseOrder: () => upsertPurchaseOrder,
  upsertUser: () => upsertUser
});
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getProviderByNit(nit) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get provider: database not available");
    return void 0;
  }
  const result = await db.select().from(providers).where(eq(providers.nit, nit)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getProviderById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(providers).where(eq(providers.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createProvider(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(providers).values(data);
  return getProviderByNit(data.nit);
}
async function getProviderOrders(providerId, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(purchaseOrders).where(eq(purchaseOrders.providerId, providerId)).orderBy(desc(purchaseOrders.fecha)).limit(limit).offset(offset);
}
async function getOrdersByDateRange(providerId, startDate, endDate) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(purchaseOrders).where(
    and(
      eq(purchaseOrders.providerId, providerId),
      gte(purchaseOrders.fecha, startDate),
      lte(purchaseOrders.fecha, endDate)
    )
  ).orderBy(desc(purchaseOrders.fecha));
}
async function getAllOrders(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.fecha)).limit(limit).offset(offset);
}
async function getOrdersByProviderAndDate(providerId, startDate, endDate) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(purchaseOrders).where(
    and(
      eq(purchaseOrders.providerId, providerId),
      gte(purchaseOrders.fecha, startDate),
      lte(purchaseOrders.fecha, endDate)
    )
  ).orderBy(desc(purchaseOrders.fecha));
}
async function getOrderById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateOrderStatus(id, estadoOrden) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(purchaseOrders).set({ estadoOrden, updatedAt: /* @__PURE__ */ new Date() }).where(eq(purchaseOrders.id, id));
  return getOrderById(id);
}
async function upsertPurchaseOrder(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.siesa_id) {
    const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.siesa_id, data.siesa_id)).limit(1);
    if (existing.length > 0) {
      await db.update(purchaseOrders).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(purchaseOrders.siesa_id, data.siesa_id));
      return existing[0];
    }
  }
  await db.insert(purchaseOrders).values(data);
  return getOrderById(data.id);
}
async function getOrderAttachments(purchaseOrderId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(attachments).where(eq(attachments.purchaseOrderId, purchaseOrderId));
}
async function getOrderItems(purchaseOrderId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orderItems).where(eq(orderItems.purchaseOrderId, purchaseOrderId));
}
async function createAttachment(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(attachments).values(data);
  return result;
}
async function createConfirmation(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(confirmations).values(data);
}
async function getOrderConfirmationHistory(purchaseOrderId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(confirmations).where(eq(confirmations.purchaseOrderId, purchaseOrderId)).orderBy(desc(confirmations.confirmedAt));
}
async function createSyncLog(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(syncLogs).values(data);
}
async function updateSyncLog(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(syncLogs).set(data).where(eq(syncLogs.id, id));
}
async function getLastSyncLog() {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(syncLogs).orderBy(desc(syncLogs.syncStartedAt)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createKpiSnapshot(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(kpiSnapshots).values(data);
}
async function getKpiSnapshot(date2) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(kpiSnapshots).where(eq(kpiSnapshots.snapshotDate, date2)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getLatestKpiSnapshot() {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(kpiSnapshots).orderBy(desc(kpiSnapshots.snapshotDate)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createVerificationToken(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(verificationTokens).values(data);
}
async function getVerificationTokenByToken(token) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function markTokenAsUsed(token) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(verificationTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq(verificationTokens.token, token));
}
async function getProviderByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(providers).where(eq(providers.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateProviderPassword(providerId, passwordHash) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(providers).set({ passwordHash, updatedAt: /* @__PURE__ */ new Date() }).where(eq(providers.id, providerId));
}
async function getAllProviders() {
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
async function updateProvider(providerId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
  await db.update(providers).set(updateData).where(eq(providers.id, providerId));
  return getProviderById(providerId);
}
async function deleteProvider(providerId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(providers).set({ estado: "inactivo", updatedAt: /* @__PURE__ */ new Date() }).where(eq(providers.id, providerId));
}
async function updateOrderGuiaAndFactura(orderId, numeroGuia, numeroFactura) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(purchaseOrders).set({
    numeroGuia: numeroGuia || null,
    numeroFactura: numeroFactura || null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(purchaseOrders.id, orderId));
  return getOrderById(orderId);
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/siesa.ts
async function fetchSiesaOrders() {
  const urlBase = "https://connektaqa.siesacloud.com/api/v3/ejecutarconsultaestandar?idCompania=7129&descripcion=API_v2_Compras_Ordenes";
  const headers = {
    "conniKey": "Connikey-muellesyfrenos-QZBCMEMX",
    "conniToken": "QZBCMEMXQJBGMU00RDFIMKKYRZJSNUEWQZBZOFM2UTVPNUKYUDVQNQ",
    "Content-Type": "application/json"
  };
  let paginaActual = 1360;
  let ultimaPaginaValida = 1360;
  const MAX_PAGINAS = 5e3;
  console.log("[Siesa] Buscando \xFAltimas \xF3rdenes (Paginaci\xF3n Inversa)...");
  while (paginaActual < MAX_PAGINAS) {
    const url = `${urlBase}&paginacion=numPag=${paginaActual}|tamPag=100`;
    let text2 = "";
    try {
      const response = await fetch(url, { headers });
      text2 = await response.text();
      if (!text2 || text2.trim().length === 0) {
        break;
      }
      const data = JSON.parse(text2);
    } catch (error) {
      console.error("[Siesa] Error en b\xFAsqueda de p\xE1gina:", error);
      console.error("[Siesa] Respuesta recibida que caus\xF3 el error:", text2);
      break;
    }
  }
  console.log(`[Siesa] Escaneando p\xE1gina final: ${ultimaPaginaValida}`);
  const urlFinal = `${urlBase}&paginacion=numPag=${ultimaPaginaValida}|tamPag=100`;
  const finalRes = await fetch(urlFinal, { headers });
  let finalText = "";
  try {
    const finalRes2 = await fetch(urlFinal, { headers });
    finalText = await finalRes2.text();
    if (!finalText || finalText.trim().length === 0) {
      console.log("[Siesa] La p\xE1gina final no devolvi\xF3 datos.");
      return [];
    }
    const finalData = JSON.parse(finalText);
    return finalData?.detalle?.Table || [];
  } catch (e) {
    console.error("[Siesa] Error parseando JSON final:", e);
    console.error("[Siesa] Respuesta final recibida que caus\xF3 el error:", finalText);
    return [];
  }
}
function mapSiesaOrderToDb(siesaOrder) {
  const precioUnitario = parseFloat(
    String(siesaOrder.f421_precio_unitario).replace(/[.,]/g, "") || "0"
  ) / 100;
  const cantidad = parseFloat(String(siesaOrder.f421_cant_pedida)) || 0;
  const descuentoGlobal = parseFloat(
    String(siesaOrder.f421_vlr_dscto_global).replace(/[.,]/g, "") || "0"
  ) / 100;
  const subtotal = precioUnitario * cantidad;
  const impuestos = subtotal * 0.19;
  const valorTotal = subtotal + impuestos;
  const valorBruto = subtotal;
  return {
    consecutivo: siesaOrder.f420_consec_docto,
    nit: siesaOrder.f200_nit_prov,
    razonSocial: siesaOrder.f200_razon_social_prov,
    fecha: new Date(siesaOrder.f420_fecha),
    ciudad: "N/A",
    referencia: siesaOrder.f120_referencia,
    descripcion: siesaOrder.f120_descripcion,
    cantidad,
    precioUnitario,
    valorBruto,
    impuestos,
    subtotal,
    descuentoGlobal,
    valorTotal,
    notas: siesaOrder.f421_notas,
    estadoOrden: "pendiente",
    // Siempre comienza como pendiente
    compradorRazonSocial: siesaOrder.f200_razon_social_comprador,
    siesaOrderId: `${siesaOrder.f420_id_tipo_docto}-${siesaOrder.f420_consec_docto}`
    // ID único de Siesa
  };
}
var init_siesa = __esm({
  "server/siesa.ts"() {
    "use strict";
  }
});

// server/workers/siesaSyncWorker.ts
var siesaSyncWorker_exports = {};
__export(siesaSyncWorker_exports, {
  syncSiesaOrders: () => syncSiesaOrders
});
import { eq as eq2, desc as desc2, and as and2 } from "drizzle-orm";
async function syncSiesaOrders() {
  const startTime = /* @__PURE__ */ new Date();
  let newOrdersCount = 0;
  let updatedOrdersCount = 0;
  try {
    console.log("[SiesaSyncWorker] Iniciando sincronizaci\xF3n incremental...");
    const db = await getDb();
    if (!db) throw new Error("Database connection not available");
    const lastLog = await db.select().from(syncLogs).where(eq2(syncLogs.status, "exitosa")).orderBy(desc2(syncLogs.syncEndedAt)).limit(1);
    const lastSyncDate = lastLog.length > 0 ? new Date(lastLog[0].syncEndedAt) : new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0));
    const siesaData = await fetchSiesaOrders();
    if (siesaData.length === 0) {
      console.log("[SiesaSyncWorker] No se encontraron datos nuevos o la respuesta fue vac\xEDa.");
    } else {
      console.log(`[SiesaSyncWorker] Se obtuvieron ${siesaData.length} registros para procesar.`);
    }
    const ordersMap = /* @__PURE__ */ new Map();
    for (const item of siesaData) {
      const key = `${item.f200_nit_prov}-${item.f420_consec_docto}`;
      if (!ordersMap.has(key)) {
        ordersMap.set(key, []);
      }
      ordersMap.get(key).push(item);
    }
    console.log(`[SiesaSyncWorker] Procesando ${ordersMap.size} \xF3rdenes \xFAnicas.`);
    for (const [key, items] of Array.from(ordersMap.entries())) {
      try {
        const firstItem = items[0];
        const fechaAprobaStr = firstItem.f420_fecha_ts_aprobacion;
        const fechaAproba = fechaAprobaStr ? new Date(fechaAprobaStr) : /* @__PURE__ */ new Date(0);
        if (fechaAproba <= lastSyncDate) continue;
        let providerResult = await db.select().from(providers).where(eq2(providers.nit, firstItem.f200_nit_prov)).limit(1);
        let providerId;
        if (providerResult.length === 0) {
          const [res] = await db.insert(providers).values({
            nit: firstItem.f200_nit_prov,
            razonSocial: firstItem.f200_razon_social_prov || "Proveedor Sin Nombre",
            email: `prov_${firstItem.f200_nit_prov}@sistema.com`,
            celular: "0000000000",
            telefono: "N/A",
            passwordHash: "temp-hash",
            estado: "activo"
          });
          providerId = res.insertId;
        } else {
          providerId = providerResult[0].id;
        }
        const mappedItems = items.map((item) => mapSiesaOrderToDb(item));
        const existingOrder = await db.select().from(purchaseOrders).where(and2(
          eq2(purchaseOrders.providerId, providerId),
          eq2(purchaseOrders.consecutivo, firstItem.f420_consec_docto)
        )).limit(1);
        let orderId;
        if (existingOrder.length === 0) {
          const [orderRes] = await db.insert(purchaseOrders).values({
            providerId,
            siesaId: firstItem.f420_id_interno?.toString().trim() || null,
            consecutivo: firstItem.f420_consec_docto,
            fecha: new Date(firstItem.f420_fecha),
            referencia: firstItem.f120_referencia || "N/A",
            descripcion: firstItem.f120_descripcion || "N/A",
            valorTotal: "0",
            subtotal: "0",
            impuestos: "0",
            estadoOrden: "pendiente",
            notificadoWpp: 0
          });
          orderId = orderRes.insertId;
          newOrdersCount++;
        } else {
          orderId = existingOrder[0].id;
          updatedOrdersCount++;
        }
        for (const mItem of mappedItems) {
          const itemExists = await db.select().from(orderItems).where(and2(
            eq2(orderItems.purchaseOrderId, orderId),
            eq2(orderItems.referencia, mItem.referencia)
          )).limit(1);
          if (itemExists.length === 0) {
            await db.insert(orderItems).values({
              purchaseOrderId: orderId,
              referencia: mItem.referencia,
              descripcion: mItem.descripcion,
              cantidad: String(mItem.cantidad),
              precioUnitario: String(mItem.precioUnitario),
              impuestos: String(mItem.impuestos),
              valorTotal: String(mItem.valorTotal)
            });
          }
        }
        const currentItems = await db.select().from(orderItems).where(eq2(orderItems.purchaseOrderId, orderId));
        const total = currentItems.reduce((sum, i) => sum + parseFloat(i.valorTotal || "0"), 0);
        const impuestos = currentItems.reduce((sum, i) => sum + parseFloat(i.impuestos || "0"), 0);
        const subtotal = total - impuestos;
        await db.update(purchaseOrders).set({
          valorTotal: String(total.toFixed(2)),
          subtotal: String(subtotal.toFixed(2)),
          impuestos: String(impuestos.toFixed(2))
        }).where(eq2(purchaseOrders.id, orderId));
      } catch (err) {
        console.error(`[SiesaSyncWorker] Error procesando orden ${key}:`, err);
      }
    }
    await db.insert(syncLogs).values({
      syncStartedAt: startTime,
      syncEndedAt: /* @__PURE__ */ new Date(),
      status: "exitosa",
      recordsProcessed: siesaData.length,
      recordsCreated: newOrdersCount,
      recordsUpdated: updatedOrdersCount
    });
    console.log(`[SiesaSyncWorker] Finalizado. Nuevas: ${newOrdersCount}, Actualizadas: ${updatedOrdersCount}`);
    return { success: true, newOrdersCount, updatedOrdersCount };
  } catch (error) {
    console.error("[SiesaSyncWorker] Error cr\xEDtico:", error);
    return { success: false };
  }
}
var init_siesaSyncWorker = __esm({
  "server/workers/siesaSyncWorker.ts"() {
    "use strict";
    init_siesa();
    init_db();
    init_schema();
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";

// server/auth.ts
init_env();
import crypto from "crypto";
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, hash) {
  try {
    const [salt, storedHash] = hash.split(":");
    const computedHash = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
    return computedHash === storedHash;
  } catch (error) {
    return false;
  }
}
function generateProviderToken(providerId, nit) {
  console.log("[Auth] Generando token para providerId:", providerId, "nit:", nit);
  const payload = {
    providerId,
    nit,
    iat: Math.floor(Date.now() / 1e3),
    exp: Math.floor(Date.now() / 1e3) + 24 * 60 * 60
    // 24 horas
  };
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url"
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", ENV.cookieSecret).update(`${header}.${body}`).digest("base64url");
  const finalToken = `${header}.${body}.${signature}`;
  console.log("[Auth] Token generado exitosamente");
  return finalToken;
}
function isValidNIT(nit) {
  const nitRegex = /^\d{5,15}$/;
  return nitRegex.test(nit.replace(/[.-]/g, ""));
}
function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}
function isTokenExpired(expiresAt) {
  return /* @__PURE__ */ new Date() > expiresAt;
}
function isValidPhoneNumber(phone) {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ""));
}

// server/email.ts
init_env();
import nodemailer from "nodemailer";
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: ENV.emailFrom,
      pass: ENV.emailPassword
    }
  });
}
function getVerificationEmailHTML(razonSocial, token, frontendUrl = "https://portal-proveedores.manus.space") {
  const verificationLink = `${frontendUrl}?tab=register&token=${token}`;
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 24px;
        }
        .content {
          margin: 30px 0;
        }
        .content p {
          margin: 15px 0;
        }
        .token-section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #007bff;
        }
        .token-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .token-value {
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          color: #007bff;
          word-break: break-all;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          transition: background-color 0.3s;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #999;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
          padding: 12px;
          border-radius: 4px;
          margin: 15px 0;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>\u{1F510} Verificaci\xF3n de Correo</h1>
        </div>

        <div class="content">
          <p>Hola <strong>${razonSocial}</strong>,</p>

          <p>Gracias por registrarte en el <strong>Portal de Proveedores</strong>. Para completar tu registro, necesitamos verificar tu correo electr\xF3nico.</p>

          <div class="token-section">
            <div class="token-label">Tu c\xF3digo de verificaci\xF3n:</div>
            <div class="token-value">${token}</div>
          </div>

          <p>Ingresa este c\xF3digo en el portal para completar tu registro. El c\xF3digo es v\xE1lido por <strong>24 horas</strong>.</p>

          <div class="button-container">
            <a href="${verificationLink}" class="button">Verificar Correo</a>
          </div>

          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; font-size: 12px; color: #666;">${verificationLink}</p>

          <div class="warning">
            \u26A0\uFE0F <strong>Seguridad:</strong> Si no solicitaste este registro, ignora este correo. No compartas tu c\xF3digo de verificaci\xF3n con nadie.
          </div>
        </div>

        <div class="footer">
          <p>\xA9 2024 Portal de Proveedores. Todos los derechos reservados.</p>
          <p>Este es un correo autom\xE1tico, por favor no respondas a esta direcci\xF3n.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
async function sendVerificationEmail(email, razonSocial, token) {
  try {
    if (!ENV.emailFrom || !ENV.emailPassword) {
      console.error("[Email] Credenciales de correo no configuradas");
      return {
        success: false,
        error: "Credenciales de correo no configuradas"
      };
    }
    const transporter = createTransporter();
    const htmlContent = getVerificationEmailHTML(razonSocial, token);
    const mailOptions = {
      from: ENV.emailFrom,
      to: email,
      subject: "Verifica tu correo - Portal de Proveedores",
      html: htmlContent,
      text: `Hola ${razonSocial},

Tu c\xF3digo de verificaci\xF3n es: ${token}

Este c\xF3digo es v\xE1lido por 24 horas.

Si no solicitaste este registro, ignora este correo.`
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Correo enviado exitosamente a ${email}. MessageId: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[Email] Error al enviar correo a ${email}:`, errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}

// server/whatsapp.ts
init_env();
import axios2 from "axios";
async function sendWhatsAppNotification(payload) {
  try {
    const apiUrl = ENV.whatsappApiUrl || "https://repuestossimonbolivar.com/api/whatsapp/test?tipo=logistica_diligencia";
    const token = ENV.whatsappApiToken || "t{;tB9oO}0WSix=qi!/{f";
    const telefonoDestino = payload.numero_telefonico.replace(/\s+/g, "");
    const response = await axios2.post(
      apiUrl,
      { ...payload, numero_telefonico: telefonoDestino },
      { headers: { "Content-Type": "application/json", "Token": token }, timeout: 15e3 }
    );
    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error("[WhatsApp] Error en sendWhatsAppNotification:", error.response?.data || error.message);
    return false;
  }
}
async function sendConfirmationNotification(payload) {
  try {
    const apiUrl = "https://repuestossimonbolivar.com/api/whatsapp/test?tipo=proveedores_orden_compra_aprobada";
    const token = "t{;tB9oO}0WSix=qi!/{f";
    const response = await axios2.post(
      apiUrl,
      {
        orden_compra: payload.consecutivo,
        proveedor: payload.proveedor,
        url: payload.url,
        numero_telefonico: payload.celular
      },
      { headers: { "Content-Type": "application/json", "Token": token } }
    );
    return response.status === 200 || response.status === 201;
  } catch (error) {
    console.error("[WhatsApp] Error en sendConfirmationNotification:", error.response?.data || error.message);
    return false;
  }
}
function formatOrderNumber(tipoDocto, consec) {
  const consecutivoStr = String(consec).padStart(6, "0");
  return `${tipoDocto}-${consecutivoStr}`;
}

// server/routers.ts
init_db();
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  provider: router({
    register: publicProcedure.input(
      z2.object({
        nit: z2.string().min(5).max(15),
        email: z2.string().email(),
        celular: z2.string().length(10),
        razonSocial: z2.string().min(3)
      })
    ).mutation(async ({ input }) => {
      if (!isValidNIT(input.nit)) {
        throw new Error("NIT invalido");
      }
      if (!isValidPhoneNumber(input.celular)) {
        throw new Error("Celular debe tener 10 digitos");
      }
      const existingProvider = await getProviderByNit(input.nit);
      if (existingProvider) {
        throw new Error("Este NIT ya esta registrado");
      }
      const existingEmail = await getProviderByEmail(input.email);
      if (existingEmail) {
        throw new Error("Este correo ya esta registrado");
      }
      const token = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await createVerificationToken({
        nit: input.nit,
        email: input.email,
        celular: input.celular,
        token,
        tokenType: "email_verification",
        expiresAt
      });
      const emailResult = await sendVerificationEmail(
        input.email,
        input.razonSocial,
        token
      );
      if (!emailResult.success) {
        console.warn(
          `[Provider Register] Correo no enviado a ${input.email}: ${emailResult.error}`
        );
      }
      return {
        success: true,
        message: "Se ha enviado un token de verificacion a tu correo",
        token: process.env.NODE_ENV !== "production" ? token : void 0
      };
    }),
    verifyToken: publicProcedure.input(
      z2.object({
        token: z2.string()
      })
    ).mutation(async ({ input }) => {
      const verificationToken = await getVerificationTokenByToken(input.token);
      if (!verificationToken) {
        throw new Error("Token invalido");
      }
      if (isTokenExpired(verificationToken.expiresAt)) {
        throw new Error("Token expirado");
      }
      if (verificationToken.usedAt) {
        throw new Error("Token ya fue utilizado");
      }
      return {
        success: true,
        message: "Token verificado correctamente",
        nit: verificationToken.nit,
        email: verificationToken.email
      };
    }),
    createPassword: publicProcedure.input(
      z2.object({
        token: z2.string(),
        password: z2.string().min(8),
        razonSocial: z2.string().min(3)
      })
    ).mutation(async ({ input }) => {
      const verificationToken = await getVerificationTokenByToken(input.token);
      if (!verificationToken) {
        throw new Error("Token invalido");
      }
      if (isTokenExpired(verificationToken.expiresAt)) {
        throw new Error("Token expirado");
      }
      if (verificationToken.usedAt) {
        throw new Error("Token ya fue utilizado");
      }
      const passwordHash = hashPassword(input.password);
      const provider = await createProvider({
        nit: verificationToken.nit,
        email: verificationToken.email,
        celular: verificationToken.celular,
        razonSocial: input.razonSocial,
        passwordHash
      });
      await markTokenAsUsed(input.token);
      const jwtToken = generateProviderToken(provider.id, provider.nit);
      return {
        success: true,
        message: "Proveedor registrado exitosamente",
        token: jwtToken,
        provider: {
          id: provider.id,
          nit: provider.nit,
          email: provider.email
        }
      };
    }),
    login: publicProcedure.input(
      z2.object({
        nit: z2.string().min(5).max(15),
        password: z2.string().min(6)
      })
    ).mutation(async ({ input }) => {
      if (!isValidNIT(input.nit)) {
        throw new Error("NIT invalido");
      }
      const provider = await getProviderByNit(input.nit);
      if (!provider) {
        throw new Error("Proveedor no encontrado");
      }
      if (provider.estado !== "activo") {
        throw new Error("Proveedor inactivo");
      }
      if (!verifyPassword(input.password, provider.passwordHash)) {
        throw new Error("Contrasena incorrecta");
      }
      const token = generateProviderToken(provider.id, provider.nit);
      return {
        success: true,
        token,
        provider: {
          id: provider.id,
          nit: provider.nit,
          razonSocial: provider.razonSocial,
          email: provider.email
        }
      };
    })
  }),
  attachments: router({
    upload: publicProcedure.input(
      z2.object({
        orderId: z2.number(),
        providerId: z2.number(),
        type: z2.enum(["factura", "guia"]),
        fileKey: z2.string(),
        fileUrl: z2.string(),
        fileName: z2.string()
      })
    ).mutation(async ({ input }) => {
      const order = await getOrderById(input.orderId);
      if (!order) {
        throw new Error("Orden no encontrada");
      }
      if (order.providerId !== input.providerId) {
        throw new Error("No autorizado");
      }
      const tipoArchivo = input.type === "factura" ? "factura" : "guia_despacho";
      await createAttachment({
        purchaseOrderId: input.orderId,
        tipoArchivo,
        nombreArchivo: input.fileName,
        s3Key: input.fileKey,
        s3Url: input.fileUrl,
        uploadedBy: input.providerId
      });
      return { success: true, message: "Archivo cargado exitosamente" };
    })
  }),
  orders: router({
    myOrders: publicProcedure.input(
      z2.object({
        providerId: z2.number(),
        limit: z2.number().default(50),
        offset: z2.number().default(0)
      })
    ).query(async ({ input }) => {
      return await getProviderOrders(input.providerId, input.limit, input.offset);
    }),
    filterByDate: publicProcedure.input(
      z2.object({
        providerId: z2.number(),
        startDate: z2.date(),
        endDate: z2.date()
      })
    ).query(async ({ input }) => {
      return await getOrdersByDateRange(input.providerId, input.startDate, input.endDate);
    }),
    allOrders: publicProcedure.input(
      z2.object({
        limit: z2.number().default(50),
        offset: z2.number().default(0)
      })
    ).query(async ({ input }) => {
      return await getAllOrders(input.limit, input.offset);
    }),
    getById: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const order = await getOrderById(input.id);
      if (!order) return null;
      const items = await getOrderItems(input.id);
      return { ...order, items };
    }),
    confirm: publicProcedure.input(
      z2.object({
        orderId: z2.number(),
        providerId: z2.number()
      })
    ).mutation(async ({ input, ctx }) => {
      const order = await getOrderById(input.orderId);
      const provider = await getProviderById(input.providerId);
      if (!order || !provider) {
        throw new Error("Orden o Proveedor no encontrado");
      }
      if (order.providerId !== input.providerId) {
        throw new Error("No autorizado");
      }
      const previousStatus = order.estadoOrden;
      await updateOrderStatus(input.orderId, "confirmada");
      await createConfirmation({
        purchaseOrderId: input.orderId,
        providerId: input.providerId,
        estadoAnterior: previousStatus,
        estadoNuevo: "confirmada",
        confirmedAt: /* @__PURE__ */ new Date(),
        ipAddress: ctx.req.ip || "unknown",
        userAgent: ctx.req.get("user-agent") || "unknown"
      });
      try {
        await sendConfirmationNotification({
          consecutivo: order.consecutivo,
          proveedor: provider.razonSocial,
          url: "http://repuestossimonbolivar.com",
          celular: "3233315933"
          // Número compras fijo
        });
        console.log(`[WhatsApp] Notificaci\xF3n enviada para la orden ${order.consecutivo}`);
      } catch (wsError) {
        console.error("[WhatsApp] Error al enviar notificaci\xF3n:", wsError);
      }
      return { success: true, order: await getOrderById(input.orderId) };
    }),
    getAttachments: publicProcedure.input(z2.object({ orderId: z2.number() })).query(async ({ input }) => {
      return await getOrderAttachments(input.orderId);
    }),
    getHistory: publicProcedure.input(z2.object({ orderId: z2.number() })).query(async ({ input }) => {
      return await getOrderConfirmationHistory(input.orderId);
    }),
    updateGuiaAndFactura: publicProcedure.input(
      z2.object({
        orderId: z2.number(),
        providerId: z2.number(),
        numeroGuia: z2.string().optional().nullable(),
        numeroFactura: z2.string().optional().nullable()
      })
    ).mutation(async ({ input }) => {
      const order = await getOrderById(input.orderId);
      if (!order) {
        throw new Error("Orden no encontrada");
      }
      if (order.providerId !== input.providerId) {
        throw new Error("No autorizado");
      }
      return await updateOrderGuiaAndFactura(
        input.orderId,
        input.numeroGuia || null,
        input.numeroFactura || null
      );
    })
  }),
  admin: router({
    getAllProviders: publicProcedure.query(async () => {
      const { getAllProviders: getAllProviders2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getAllProviders2();
    }),
    createProvider: publicProcedure.input(
      z2.object({
        nit: z2.string().min(5).max(15),
        razonSocial: z2.string().min(3),
        email: z2.string().email(),
        celular: z2.string().length(10),
        password: z2.string().min(8)
      })
    ).mutation(async ({ input }) => {
      const existing = await getProviderByNit(input.nit);
      if (existing) {
        throw new Error("NIT ya registrado");
      }
      const existingEmail = await getProviderByEmail(input.email);
      if (existingEmail) {
        throw new Error("Email ya registrado");
      }
      const passwordHash = hashPassword(input.password);
      const provider = await createProvider({
        nit: input.nit,
        razonSocial: input.razonSocial,
        email: input.email,
        celular: input.celular,
        passwordHash
      });
      if (!provider) {
        throw new Error("Error al crear proveedor");
      }
      return {
        success: true,
        provider: {
          id: provider.id,
          nit: provider.nit,
          razonSocial: provider.razonSocial,
          email: provider.email,
          celular: provider.celular,
          estado: provider.estado
        }
      };
    }),
    updateProvider: publicProcedure.input(
      z2.object({
        id: z2.number(),
        razonSocial: z2.string().min(3).optional(),
        email: z2.string().email().optional(),
        celular: z2.string().length(10).optional(),
        telefono: z2.string().optional(),
        ciudad: z2.string().optional(),
        direccion: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      const provider = await getProviderById(input.id);
      if (!provider) {
        throw new Error("Proveedor no encontrado");
      }
      if (input.email && input.email !== provider.email) {
        const existingEmail = await getProviderByEmail(input.email);
        if (existingEmail) {
          throw new Error("Email ya registrado");
        }
      }
      const { updateProvider: updateProviderDb } = await Promise.resolve().then(() => (init_db(), db_exports));
      const updated = await updateProviderDb(input.id, {
        razonSocial: input.razonSocial,
        email: input.email,
        celular: input.celular,
        telefono: input.telefono,
        ciudad: input.ciudad,
        direccion: input.direccion
      });
      return {
        success: true,
        provider: updated
      };
    }),
    deleteProvider: publicProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const provider = await getProviderById(input.id);
      if (!provider) {
        throw new Error("Proveedor no encontrado");
      }
      const { deleteProvider: deleteProviderDb } = await Promise.resolve().then(() => (init_db(), db_exports));
      await deleteProviderDb(input.id);
      return {
        success: true,
        message: "Proveedor desactivado correctamente"
      };
    }),
    getAllOrders: publicProcedure.input(z2.object({ limit: z2.number().default(100), offset: z2.number().default(0) })).query(async ({ input }) => {
      return await getAllOrders(input.limit, input.offset);
    }),
    filterOrders: publicProcedure.input(
      z2.object({
        providerId: z2.number().optional(),
        startDate: z2.date().optional(),
        endDate: z2.date().optional(),
        estado: z2.string().optional()
      })
    ).query(async ({ input }) => {
      let orders = await getAllOrders(1e3);
      if (input.providerId) {
        orders = orders.filter((o) => o.providerId === input.providerId);
      }
      if (input.startDate && input.endDate) {
        const startDate = input.startDate;
        const endDate = input.endDate;
        orders = orders.filter((o) => {
          const orderDate = new Date(o.fecha);
          return orderDate >= startDate && orderDate <= endDate;
        });
      }
      if (input.estado) {
        orders = orders.filter((o) => o.estadoOrden === input.estado);
      }
      return orders;
    }),
    getProviders: publicProcedure.query(async () => {
      const { getAllProviders: getAllProviders2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      return await getAllProviders2();
    }),
    getKPIs: publicProcedure.query(async () => {
      const orders = await getAllOrders(1e3);
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const totalOrders = orders.length;
      const confirmedOrders = orders.filter((o) => o.estadoOrden === "confirmada").length;
      const pendingOrders = orders.filter((o) => o.estadoOrden === "pendiente").length;
      const totalValue = orders.reduce((sum, o) => sum + parseFloat(String(o.valorTotal || 0)), 0);
      const lateOrders = orders.filter((o) => {
        if (!o.fechaEstimadaEntrega) return false;
        const deliveryDate = new Date(o.fechaEstimadaEntrega);
        deliveryDate.setHours(0, 0, 0, 0);
        return deliveryDate < today && o.estadoOrden === "pendiente";
      });
      const lateOrdersCount = lateOrders.length;
      const lateOrdersPercentage = totalOrders > 0 ? Math.round(lateOrdersCount / totalOrders * 100) : 0;
      const providerStats = {};
      orders.forEach((o) => {
        const providerId = o.providerId;
        if (!providerStats[providerId]) {
          providerStats[providerId] = {
            name: o.provider?.razonSocial || "Desconocido",
            nit: o.provider?.nit || "N/A",
            total: 0,
            confirmed: 0,
            late: 0,
            totalDaysLate: 0
          };
        }
        providerStats[providerId].total++;
        if (o.estadoOrden === "confirmada") {
          providerStats[providerId].confirmed++;
        }
        if (o.fechaEstimadaEntrega) {
          const deliveryDate = new Date(o.fechaEstimadaEntrega);
          deliveryDate.setHours(0, 0, 0, 0);
          if (deliveryDate < today && o.estadoOrden === "pendiente") {
            providerStats[providerId].late++;
            const daysLate = Math.floor((today.getTime() - deliveryDate.getTime()) / (1e3 * 60 * 60 * 24));
            providerStats[providerId].totalDaysLate += daysLate;
          }
        }
      });
      const providerMetrics = Object.values(providerStats).map((p) => ({
        name: p.name,
        nit: p.nit,
        total: p.total,
        compliance: Math.round(p.confirmed / p.total * 100),
        latePercentage: Math.round(p.late / p.total * 100),
        avgDaysLate: p.late > 0 ? Math.round(p.totalDaysLate / p.late) : 0
      }));
      const bestProvider = providerMetrics.reduce((best, current) => {
        if (!best || current.compliance > best.compliance) return current;
        return best;
      }, null);
      const worstProvider = providerMetrics.reduce((worst, current) => {
        if (!worst || current.compliance < worst.compliance) return current;
        return worst;
      }, null);
      const monthlyTrends = {};
      orders.forEach((o) => {
        const date2 = new Date(o.fecha);
        const monthKey = `${date2.getFullYear()}-${String(date2.getMonth() + 1).padStart(2, "0")}`;
        const providerId = o.providerId;
        if (!monthlyTrends[monthKey]) {
          monthlyTrends[monthKey] = {};
        }
        if (!monthlyTrends[monthKey][providerId]) {
          monthlyTrends[monthKey][providerId] = {
            name: o.provider?.razonSocial || "Desconocido",
            count: 0,
            value: 0
          };
        }
        monthlyTrends[monthKey][providerId].count++;
        monthlyTrends[monthKey][providerId].value += parseFloat(String(o.valorTotal || 0));
      });
      return {
        totalOrders,
        confirmedOrders,
        pendingOrders,
        totalValue,
        lateOrdersCount,
        lateOrdersPercentage,
        bestProvider,
        worstProvider,
        providerMetrics,
        monthlyTrends
      };
    })
  }),
  sync: router({
    syncSiesaManual: publicProcedure.mutation(async () => {
      try {
        const { syncSiesaOrders: syncSiesaOrders2 } = await Promise.resolve().then(() => (init_siesaSyncWorker(), siesaSyncWorker_exports));
        const result = await syncSiesaOrders2();
        return result;
      } catch (error) {
        console.error("[Sync] Error en sincronizaci\xF3n manual:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido"
        };
      }
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/scheduler.ts
init_siesaSyncWorker();

// server/workers/whatsappNotificationWorker.ts
init_db();
init_schema();
import { eq as eq3 } from "drizzle-orm";
async function processPendingWhatsAppNotifications() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[WhatsAppWorker] No se pudo conectar a la base de datos");
      return;
    }
    const pendingOrders = await db.select({
      order: purchaseOrders,
      provider: providers
    }).from(purchaseOrders).innerJoin(providers, eq3(purchaseOrders.providerId, providers.id)).where(eq3(purchaseOrders.notificadoWpp, 0));
    if (pendingOrders.length === 0) {
      console.log("[WhatsAppWorker] No hay notificaciones pendientes.");
      return;
    }
    console.log(`[WhatsAppWorker] Detectadas ${pendingOrders.length} \xF3rdenes para procesar.`);
    for (const item of pendingOrders) {
      const { order, provider } = item;
      const ordenNumero = formatOrderNumber(order.tipoDocumento || "FOC", order.consecutivo);
      await db.update(purchaseOrders).set({
        notificadoWpp: 1,
        fechaNotificacionWpp: /* @__PURE__ */ new Date()
      }).where(eq3(purchaseOrders.id, order.id));
      console.log(`[WhatsAppWorker] Bloqueando orden ${ordenNumero} e iniciando env\xEDo a ${provider.celular}...`);
      const success = await sendWhatsAppNotification({
        numero_telefonico: provider.celular,
        proveedor: provider.razonSocial,
        url: "https://repuestossimonbolivar.com/",
        orden_numero: ordenNumero
      });
      if (success) {
        console.log(`[WhatsAppWorker] \u2713 Notificaci\xF3n enviada exitosamente para la orden ${ordenNumero}.`);
      } else {
        await db.update(purchaseOrders).set({
          notificadoWpp: 0,
          fechaNotificacionWpp: null
        }).where(eq3(purchaseOrders.id, order.id));
        console.warn(`[WhatsAppWorker] \u2717 Fall\xF3 el env\xEDo para ${ordenNumero}. Se ha restablecido a pendiente para reintento.`);
      }
    }
  } catch (error) {
    console.error("[WhatsAppWorker] Error cr\xEDtico en el proceso de notificaciones:", error);
  }
}

// server/scheduler.ts
var syncInterval = null;
var isRunning = false;
function startScheduler() {
  if (syncInterval) {
    console.log("[Scheduler] Scheduler ya est\xE1 ejecut\xE1ndose");
    return;
  }
  console.log("[Scheduler] Iniciando scheduler de sincronizaci\xF3n y notificaciones");
  executeSyncJob();
  syncInterval = setInterval(() => {
    executeSyncJob();
  }, 10 * 60 * 1e3);
  console.log("[Scheduler] Scheduler iniciado. Ciclo cada 10 minutos");
}
async function executeSyncJob() {
  if (isRunning) {
    console.log("[Scheduler] Una tarea ya est\xE1 en progreso, saltando ejecuci\xF3n");
    return;
  }
  isRunning = true;
  const jobStartTime = /* @__PURE__ */ new Date();
  try {
    console.log(`[Scheduler] --- Iniciando Ciclo de Trabajo en ${jobStartTime.toISOString()} ---`);
    console.log("[Scheduler] Ejecutando Paso A: Sincronizaci\xF3n Siesa...");
    const result = await syncSiesaOrders();
    if (result.success) {
      console.log(
        `[Scheduler] \u2713 Sincronizaci\xF3n Siesa exitosa. Nuevas: ${result.newOrdersCount}, Actualizadas: ${result.updatedOrdersCount}`
      );
    } else {
      console.error(`[Scheduler] \u2717 Sincronizaci\xF3n Siesa fallida:`, result.error || "Error desconocido");
    }
    console.log("[Scheduler] Ejecutando Paso B y C: Procesando WhatsApps pendientes...");
    await processPendingWhatsAppNotifications();
  } catch (error) {
    console.error("[Scheduler] Error cr\xEDtico durante el ciclo de trabajo:", error);
  } finally {
    isRunning = false;
    const jobEndTime = /* @__PURE__ */ new Date();
    const duration = jobEndTime.getTime() - jobStartTime.getTime();
    console.log(`[Scheduler] --- Ciclo finalizado en ${duration}ms ---`);
  }
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startScheduler();
  });
}
startServer().catch(console.error);
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM recibido, cerrando servidor...");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("[Server] SIGINT recibido, cerrando servidor...");
  process.exit(0);
});
