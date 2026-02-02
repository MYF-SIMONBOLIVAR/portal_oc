import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileText, Upload, Clock, CheckCircle, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";

export default function OrderDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/provider/order/:id");
  const [providerId, setProviderId] = useState<number | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false); // Estado para feedback positivo

  const orderId = params?.id ? parseInt(params.id) : null;

  useEffect(() => {
    const id = localStorage.getItem("providerId");
    if (!id) {
      setLocation("/");
      return;
    }
    setProviderId(parseInt(id));
  }, [setLocation]);

  const { data: orderData, isLoading } = trpc.orders.getById.useQuery(
    { id: orderId || 0 },
    { enabled: !!orderId }
  );

  useEffect(() => {
    if (orderData) {
      setOrder(orderData);
      setItems(orderData.items || []);
    }
  }, [orderData]);

  const { data: attachmentsData } = trpc.orders.getAttachments.useQuery(
    { orderId: orderId || 0 },
    { enabled: !!orderId }
  );

  useEffect(() => {
    if (attachmentsData) {
      setAttachments(attachmentsData);
    }
  }, [attachmentsData]);

  const { data: historyData } = trpc.orders.getHistory.useQuery(
    { orderId: orderId || 0 },
    { enabled: !!orderId }
  );

  useEffect(() => {
    if (historyData) {
      setHistory(historyData);
    }
  }, [historyData]);

  const confirmMutation = trpc.orders.confirm.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
    onError: (err) => {
      setError(err.message || "Error al confirmar orden");
    },
  });

  const updateGuiaFacturaMutation = trpc.orders.updateGuiaAndFactura.useMutation({
    onSuccess: (data) => {
      setOrder(data);
      setError("");
      setShowSuccess(true);
      // Ocultar el mensaje de éxito después de 5 segundos
      setTimeout(() => setShowSuccess(false), 5000);
    },
    onError: (err) => {
      setError(err.message || "Error al guardar informacion");
      setShowSuccess(false);
    },
  });

  const handleConfirm = () => {
    if (!orderId || !providerId) return;
    confirmMutation.mutate({ orderId, providerId });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "factura" | "guia") => {
    const file = e.target.files?.[0];
    if (!file || !orderId || !providerId) return;

    const validMimeTypes: Record<string, string[]> = {
      factura: ["application/zip"],
      guia: ["application/pdf"],
    };

    if (!validMimeTypes[type].includes(file.type)) {
      setError(`Tipo de archivo inválido para ${type}. Se requiere ${type === "factura" ? "ZIP" : "PDF"}`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("El archivo es demasiado grande (máximo 50MB)");
      return;
    }

    setUploadingFile(true);
    try {
      console.log(`Cargando ${type}:`, file.name);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar archivo");
    } finally {
      setUploadingFile(false);
    }
  };

  if (!match || !orderId || !providerId) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando orden...</div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <Button variant="outline" onClick={() => setLocation("/provider/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="mt-8 text-center">
          <p className="text-slate-600">Orden no encontrada</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmada":
        return <Badge className="bg-green-100 text-green-800">Confirmada</Badge>;
      case "pendiente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case "rechazada":
        return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => setLocation("/provider/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Mis Ordenes
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Orden {order.consecutivo}</CardTitle>
                    <CardDescription>{order.referencia}</CardDescription>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.estadoOrden)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Fecha</p>
                    <p className="font-semibold">{format(new Date(order.fecha), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Ciudad</p>
                    <p className="font-semibold">{order.ciudad}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Fecha de Entrega Estimada</p>
                    <p className="font-semibold">{order.fechaEstimadaEntrega ? format(new Date(order.fechaEstimadaEntrega), "dd/MM/yyyy") : "No especificada"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Estado de Entrega</p>
                    <p className="font-semibold">{order.estadoEntrega}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Notas</p>
                  <p className="font-semibold">{order.notas || "Sin notas"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-slate-600">No hay productos en esta orden</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Referencia</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unitario</TableHead>
                          <TableHead className="text-right">Impuestos</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-semibold">{item.referencia}</TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell className="text-right">{parseFloat(String(item.cantidad)).toLocaleString("es-CO")}</TableCell>
                            <TableCell className="text-right">${parseFloat(String(item.precioUnitario)).toLocaleString("es-CO")}</TableCell>
                            <TableCell className="text-right">${parseFloat(String(item.impuestos)).toLocaleString("es-CO")}</TableCell>
                            <TableCell className="text-right font-semibold">${parseFloat(String(item.valorTotal)).toLocaleString("es-CO")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Valor Bruto</TableCell>
                      <TableCell className="text-right font-semibold">${parseFloat(String(order.valorBruto)).toLocaleString("es-CO")}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Descuento</TableCell>
                      <TableCell className="text-right font-semibold">${parseFloat(String(order.descuentoGlobal || 0)).toLocaleString("es-CO")}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Subtotal</TableCell>
                      <TableCell className="text-right font-semibold">${parseFloat(String(order.subtotal)).toLocaleString("es-CO")}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Impuestos (19%)</TableCell>
                      <TableCell className="text-right font-semibold">${parseFloat(String(order.impuestos)).toLocaleString("es-CO")}</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50">
                      <TableCell className="font-bold">TOTAL</TableCell>
                      <TableCell className="text-right font-bold text-lg">${parseFloat(String(order.valorTotal)).toLocaleString("es-CO")}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos Adjuntos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attachments.length === 0 ? (
                  <p className="text-slate-600">No hay documentos adjuntos</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att: any) => (
                      <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                        <div>
                          <p className="font-semibold">{att.tipoArchivo === "factura" ? "Factura Electrónica" : "Guía de Despacho"}</p>
                          <p className="text-sm text-slate-600">{att.nombreArchivo}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Descargar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {history.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Historial de Confirmaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {history.map((h: any) => (
                      <div key={h.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Confirmada</p>
                          <p className="text-sm text-slate-600">{h.fechaConfirmacion ? format(new Date(h.fechaConfirmacion), "dd/MM/yyyy HH:mm") : "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {order.estadoOrden === "pendiente" && (
              <Card>
                <CardHeader>
                  <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleConfirm}
                    disabled={confirmMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {confirmMutation.isPending ? "Confirmando..." : "Confirmar Orden"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Información de Envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Alerta de advertencia si faltan datos */}
                {(!order.numeroGuia || !order.numeroFactura) && !showSuccess && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Por favor completa los números de guía y factura
                    </AlertDescription>
                  </Alert>
                )}

                {/* Alerta de ÉXITO al guardar */}
                {showSuccess && (
                  <Alert className="bg-green-50 border-green-200 animate-in fade-in zoom-in duration-300">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 font-medium">
                      Información guardada correctamente
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-2">Número de Guía</label>
                  <Input
                    type="text"
                    placeholder="Ej: 123456789"
                    defaultValue={order.numeroGuia || ""}
                    onChange={(e) => {
                      setOrder({ ...order, numeroGuia: e.target.value });
                      if(showSuccess) setShowSuccess(false);
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Número de Factura</label>
                  <Input
                    type="text"
                    placeholder="Ej: FAC-2026-001234"
                    defaultValue={order.numeroFactura || ""}
                    onChange={(e) => {
                      setOrder({ ...order, numeroFactura: e.target.value });
                      if(showSuccess) setShowSuccess(false);
                    }}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (!providerId || !orderId) return;
                    setShowSuccess(false); // Reset éxito anterior
                    updateGuiaFacturaMutation.mutate({
                      orderId,
                      providerId,
                      numeroGuia: order.numeroGuia || null,
                      numeroFactura: order.numeroFactura || null,
                    });
                  }}
                  disabled={updateGuiaFacturaMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {updateGuiaFacturaMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" /> Guardando...
                    </span>
                  ) : "Guardar Información"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Fecha Estimada</p>
                  <p className="font-semibold">{order.fechaEstimadaEntrega ? format(new Date(order.fechaEstimadaEntrega), "dd/MM/yyyy") : "No especificada"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Estado</p>
                  <p className="font-semibold">{order.estadoEntrega}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}