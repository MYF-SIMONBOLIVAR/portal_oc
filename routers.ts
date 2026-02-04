import { COOKIE_NAME } from "./const";
import { getSessionCookieOptions } from "./cookies";
import { systemRouter } from "./systemRouter";
import { publicProcedure, router } from "./trpc-server";
import { z } from "zod";
import { hashPassword, verifyPassword, generateProviderToken, isValidNIT, generateVerificationToken, isTokenExpired, isValidPhoneNumber } from "./auth";
import { sendVerificationEmail } from "./email";
import { sendWhatsAppNotification, formatOrderNumber, sendConfirmationNotification, sendRejectionNotification } from "./whatsapp";
import {
  getProviderByNit,
  getProviderOrders,
  getOrdersByDateRange,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderAttachments,
  getOrderItems,
  getOrderConfirmationHistory,
  createConfirmation,
  createAttachment,
  createVerificationToken,
  getVerificationTokenByToken,
  markTokenAsUsed,
  getProviderByEmail,
  createProvider,
  updateProviderPassword,
  getProviderById,
  updateOrderGuiaAndFactura,
  
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  provider: router({
    register: publicProcedure
      .input(
        z.object({
          nit: z.string().min(5).max(15),
          email: z.string().email(),
          celular: z.string().length(10),
          razonSocial: z.string().min(3),
        })
      )
      .mutation(async ({ input }) => {
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
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await createVerificationToken({
          nit: input.nit,
          email: input.email,
          celular: input.celular,
          token,
          tokenType: "email_verification",
          expiresAt,
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
          token: process.env.NODE_ENV !== "production" ? token : undefined,
        };
      }),

    verifyToken: publicProcedure
      .input(
        z.object({
          token: z.string(),
        })
      )
      .mutation(async ({ input }) => {
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
          email: verificationToken.email,
        };
      }),

    createPassword: publicProcedure
      .input(
        z.object({
          token: z.string(),
          password: z.string().min(8),
          razonSocial: z.string().min(3),
        })
      )
      .mutation(async ({ input }) => {
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
          passwordHash,
        });

        await markTokenAsUsed(input.token);

        const jwtToken = generateProviderToken(provider!.id, provider!.nit);

        return {
          success: true,
          message: "Proveedor registrado exitosamente",
          token: jwtToken,
          provider: {
            id: provider!.id,
            nit: provider!.nit,
            email: provider!.email,
            role: provider.role,
          },
        };
      }),

    login: publicProcedure
      .input(
        z.object({
          nit: z.string().min(5).max(15),
          password: z.string().min(6),
        })
      )
      .mutation(async ({ input, ctx }) => {
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

        const token = generateProviderToken(provider.id, provider.nit, provider.role);

        ctx.res.cookie("portal_session", token, {
          maxAge: 365 * 24 * 60 * 60 * 1000,
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });

        return {
          success: true,
          token,
          provider: {
            id: provider.id,
            nit: provider.nit,
            razonSocial: provider.razonSocial,
            email: provider.email,
            role: provider.role,
          },
        };
      }), // 👈 Termina en coma para separar de attachments

    attachments: {
      upload: publicProcedure
        .input(
          z.object({
            orderId: z.number(),
            providerId: z.number(),
            type: z.enum(["factura", "guia"]),
            fileKey: z.string(),
            fileUrl: z.string(),
            fileName: z.string(),
          })
        )
        .mutation(async ({ input }) => {
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
            uploadedBy: input.providerId,
          });
        return { success: true, message: "Archivo cargado exitosamente" };
      } // 1. Cierra el .mutation de upload
    };     // 2. Cierra el objeto 'attachments' (OJO: SIN PUNTO Y COMA AQUÍ)
  }),    // 3. Cierra el router principal

  orders: router({
    myOrders: publicProcedure
      .input(
        z.object({
          providerId: z.number(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await getProviderOrders(input.providerId, input.limit, input.offset);
      }),

    filterByDate: publicProcedure
      .input(
        z.object({
          providerId: z.number(),
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await getOrdersByDateRange(input.providerId, input.startDate, input.endDate);
      }),

    allOrders: publicProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await getAllOrders(input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await getOrderById(input.id);
        if (!order) return null;
        
        const items = await getOrderItems(input.id);
        return { ...order, items };
      }),

    confirm: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          providerId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 1. Obtener datos de la orden y el proveedor para la notificación
        const order = await getOrderById(input.orderId);
        const provider = await getProviderById(input.providerId);

        if (!order || !provider) {
          throw new Error("Orden o Proveedor no encontrado");
        }

        if (order.providerId !== input.providerId) {
          throw new Error("No autorizado");
        }

        const previousStatus = order.estadoOrden;
        
        // 2. Actualizar estado en la BD
        await updateOrderStatus(input.orderId, "confirmada");

        // 3. Crear registro en el historial de confirmaciones
        await createConfirmation({
          purchaseOrderId: input.orderId,
          providerId: input.providerId,
          estadoAnterior: previousStatus as any,
          estadoNuevo: "confirmada",
          confirmedAt: new Date(),
          ipAddress: ctx.req.ip || "unknown",
          userAgent: ctx.req.get("user-agent") || "unknown",
        });

        // 4.Enviar notificación de WhatsApp (Confirmación)
        try {
          await sendConfirmationNotification({
            consecutivo: order.consecutivo,
            proveedor: provider.razonSocial,
            url: "http://repuestossimonbolivar.com",
            celular: "3233315933" // Número compras fijo
          });
          console.log(`[WhatsApp] Notificación enviada para la orden ${order.consecutivo}`);
        } catch (wsError) {
          // Logueamos el error pero no bloqueamos la respuesta al usuario
          console.error("[WhatsApp] Error al enviar notificación:", wsError);
        }

        return { success: true, order: await getOrderById(input.orderId) };
      }),

    getAttachments: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await getOrderAttachments(input.orderId);
      }),

    getHistory: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await getOrderConfirmationHistory(input.orderId);
      }),

    reject: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          providerId: z.number(),
          motivo: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const order = await getOrderById(input.orderId);
        const provider = await getProviderById(input.providerId);

        if (!order || !provider) {
          throw new Error("Orden o Proveedor no encontrado");
        }

        if (order.providerId !== input.providerId) {
          throw new Error("No autorizado");
        }

        const previousStatus = order.estadoOrden;
        
        // 1. Actualizar estado a rechazada
        await updateOrderStatus(input.orderId, "rechazada");

        // 2. Registrar en historial
        await createConfirmation({
          purchaseOrderId: input.orderId,
          providerId: input.providerId,
          estadoAnterior: previousStatus as any,
          estadoNuevo: "rechazada",
          confirmedAt: new Date(),
          ipAddress: ctx.req.ip || "unknown",
          userAgent: ctx.req.get("user-agent") || "unknown",
        });

        // 3. Enviar notificación de WhatsApp (RECHAZO)
        try {
          const ordenNumero = formatOrderNumber(order.tipoDocumento || "FOC", order.consecutivo);
          await sendRejectionNotification({
            consecutivo: ordenNumero,
            proveedor: provider.razonSocial,
            url: "http://repuestossimonbolivar.com",
            celular: "3233315933" // Número compras
          });
        } catch (wsError) {
          console.error("[WhatsApp] Error al enviar rechazo:", wsError);
        }

        return { success: true, order: await getOrderById(input.orderId) };
      }),

    updateGuiaAndFactura: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          providerId: z.number(),
          numeroGuia: z.string().optional().nullable(),
          numeroFactura: z.string().optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
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
      }),
  }),

  admin: router({
    getAllProviders: publicProcedure
      .query(async () => {
        const { getAllProviders } = await import("./db");
        return await getAllProviders();
      }),

    createProvider: publicProcedure
      .input(
        z.object({
          nit: z.string().min(5).max(15),
          razonSocial: z.string().min(3),
          email: z.string().email(),
          celular: z.string().length(10),
          password: z.string().min(8),
        })
      )
      .mutation(async ({ input }) => {
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
          passwordHash,
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
            estado: provider.estado,
          },
        };
      }),

    updateProvider: publicProcedure
      .input(
        z.object({
          id: z.number(),
          razonSocial: z.string().min(3).optional(),
          email: z.string().email().optional(),
          celular: z.string().length(10).optional(),
          telefono: z.string().optional(),
          ciudad: z.string().optional(),
          direccion: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
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

        const { updateProvider: updateProviderDb } = await import("./db");
        const updated = await updateProviderDb(input.id, {
          razonSocial: input.razonSocial,
          email: input.email,
          celular: input.celular,
          telefono: input.telefono,
          ciudad: input.ciudad,
          direccion: input.direccion,
        });

        return {
          success: true,
          provider: updated,
        };
      }),

    deleteProvider: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const provider = await getProviderById(input.id);
        if (!provider) {
          throw new Error("Proveedor no encontrado");
        }

        const { deleteProvider: deleteProviderDb } = await import("./db");
        await deleteProviderDb(input.id);

        return {
          success: true,
          message: "Proveedor desactivado correctamente",
        };
      }),

    getAllOrders: publicProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getAllOrders(input.limit, input.offset);
      }),

    filterOrders: publicProcedure
      .input(
        z.object({
          providerId: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          estado: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        let orders = await getAllOrders(1000);

        if (input.providerId) {
          orders = orders.filter((o: any) => o.providerId === input.providerId);
        }

        if (input.startDate && input.endDate) {
          const startDate = input.startDate;
          const endDate = input.endDate;
          orders = orders.filter((o: any) => {
            const orderDate = new Date(o.fecha);
            return orderDate >= startDate && orderDate <= endDate;
          });
        }

        if (input.estado) {
          orders = orders.filter((o: any) => o.estadoOrden === input.estado);
        }

        return orders;
      }),

    getProviders: publicProcedure
      .query(async () => {
        const { getAllProviders } = await import("./db");
        return await getAllProviders();
      }),

    getKPIs: publicProcedure
      .query(async () => {
        const orders = await getAllOrders(1000);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalOrders = orders.length;
        const confirmedOrders = orders.filter((o: any) => o.estadoOrden === 'confirmada').length;
        const pendingOrders = orders.filter((o: any) => o.estadoOrden === 'pendiente').length;
        const totalValue = orders.reduce((sum: number, o: any) => sum + parseFloat(String(o.valorTotal || 0)), 0);

        const lateOrders = orders.filter((o: any) => {
          if (!o.fechaEstimadaEntrega) return false;
          const deliveryDate = new Date(o.fechaEstimadaEntrega);
          deliveryDate.setHours(0, 0, 0, 0);
          return deliveryDate < today && o.estadoOrden === 'pendiente';
        });
        const lateOrdersCount = lateOrders.length;
        const lateOrdersPercentage = totalOrders > 0 ? Math.round((lateOrdersCount / totalOrders) * 100) : 0;

        const providerStats: any = {};
        orders.forEach((o: any) => {
          const providerId = o.providerId;
          if (!providerStats[providerId]) {
            providerStats[providerId] = {
              name: o.provider?.razonSocial || 'Desconocido',
              nit: o.provider?.nit || 'N/A',
              total: 0,
              confirmed: 0,
              late: 0,
              totalDaysLate: 0
            };
          }
          providerStats[providerId].total++;
          if (o.estadoOrden === 'confirmada') {
            providerStats[providerId].confirmed++;
          }
          if (o.fechaEstimadaEntrega) {
            const deliveryDate = new Date(o.fechaEstimadaEntrega);
            deliveryDate.setHours(0, 0, 0, 0);
            if (deliveryDate < today && o.estadoOrden === 'pendiente') {
              providerStats[providerId].late++;
              const daysLate = Math.floor((today.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
              providerStats[providerId].totalDaysLate += daysLate;
            }
          }
        });

        const providerMetrics = Object.values(providerStats).map((p: any) => ({
          name: p.name,
          nit: p.nit,
          total: p.total,
          compliance: Math.round((p.confirmed / p.total) * 100),
          latePercentage: Math.round((p.late / p.total) * 100),
          avgDaysLate: p.late > 0 ? Math.round(p.totalDaysLate / p.late) : 0
        }));

        const bestProvider = providerMetrics.reduce((best: any, current: any) => {
          if (!best || current.compliance > best.compliance) return current;
          return best;
        }, null);

        const worstProvider = providerMetrics.reduce((worst: any, current: any) => {
          if (!worst || current.compliance < worst.compliance) return current;
          return worst;
        }, null);

        const monthlyTrends: any = {};
        orders.forEach((o: any) => {
          const date = new Date(o.fecha);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const providerId = o.providerId;
          
          if (!monthlyTrends[monthKey]) {
            monthlyTrends[monthKey] = {};
          }
          if (!monthlyTrends[monthKey][providerId]) {
            monthlyTrends[monthKey][providerId] = {
              name: o.provider?.razonSocial || 'Desconocido',
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
      }),
  }),

  sync: router({
    syncSiesaManual: publicProcedure.mutation(async () => {
      try {
        const { syncSiesaOrders } = await import("./workers/siesaSyncWorker");
        const result = await syncSiesaOrders();
        return result;
      } catch (error) {
        console.error("[Sync] Error en sincronización manual:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
