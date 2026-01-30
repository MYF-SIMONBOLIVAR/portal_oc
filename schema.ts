import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, longtext } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabla de Proveedores
 */
export const providers = mysqlTable("providers", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = typeof providers.$inferInsert;

/**
 * Tabla de Órdenes de Compra
 */
export const purchaseOrders = mysqlTable("purchaseOrders", {
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
  fechaNotificacionWpp: timestamp("fecha_notificacion_wpp"),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

/**
 * Tabla de Items de Orden de Compra
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  referencia: varchar("referencia", { length: 100 }).notNull(),
  descripcion: longtext("descripcion").notNull(),
  cantidad: decimal("cantidad", { precision: 10, scale: 2 }).notNull(),
  precioUnitario: decimal("precioUnitario", { precision: 12, scale: 2 }).notNull(),
  impuestos: decimal("impuestos", { precision: 12, scale: 2 }).notNull(),
  valorTotal: decimal("valorTotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Tabla de Archivos Adjuntos
 */
export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  tipoArchivo: mysqlEnum("tipoArchivo", ["factura", "guia_despacho"]).notNull(),
  nombreArchivo: varchar("nombreArchivo", { length: 255 }).notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: varchar("s3Url", { length: 1000 }).notNull(),
  mimeType: varchar("mimeType", { length: 50 }),
  tamaño: int("tamaño"),
  uploadedBy: int("uploadedBy").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

/**
 * Tabla de Confirmaciones
 */
export const confirmations = mysqlTable("confirmations", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  providerId: int("providerId").notNull(),
  estadoAnterior: mysqlEnum("estadoAnterior", ["pendiente", "confirmada", "rechazada"]),
  estadoNuevo: mysqlEnum("estadoNuevo", ["pendiente", "confirmada", "rechazada"]).notNull(),
  razonRechazo: longtext("razonRechazo"),
  confirmedAt: timestamp("confirmedAt").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
});

/**
 * Tabla de Logs de Sincronización
 */
export const syncLogs = mysqlTable("syncLogs", {
  id: int("id").autoincrement().primaryKey(),
  syncStartedAt: timestamp("syncStartedAt").notNull(),
  syncEndedAt: timestamp("syncEndedAt"),
  status: mysqlEnum("status", ["en_progreso", "exitosa", "fallida"]).notNull(),
  recordsProcessed: int("recordsProcessed").default(0),
  recordsCreated: int("recordsCreated").default(0),
  recordsUpdated: int("recordsUpdated").default(0),
  errorMessage: longtext("errorMessage"),
  nextSyncScheduledFor: timestamp("nextSyncScheduledFor"),
});

/**
 * Tabla de Tokens de Verificación
 */
export const verificationTokens = mysqlTable("verificationTokens", {
  id: int("id").autoincrement().primaryKey(),
  nit: varchar("nit", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  celular: varchar("celular", { length: 10 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  tokenType: mysqlEnum("tokenType", ["email_verification", "password_reset"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Tabla de Snapshots de KPIs
 */
export const kpiSnapshots = mysqlTable("kpiSnapshots", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- DEFINICIÓN DE RELACIONES ---

export const providersRelations = relations(providers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
  attachments: many(attachments),
  confirmations: many(confirmations),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  provider: one(providers, {
    fields: [purchaseOrders.providerId],
    references: [providers.id],
  }),
  items: many(orderItems),
  attachments: many(attachments),
  confirmations: many(confirmations),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [orderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [attachments.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  uploadedByProvider: one(providers, {
    fields: [attachments.uploadedBy],
    references: [providers.id],
  }),
}));

export const confirmationsRelations = relations(confirmations, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [confirmations.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  provider: one(providers, {
    fields: [confirmations.providerId],
    references: [providers.id],
  }),
}));