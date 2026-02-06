import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Input } from "./input";
import { ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, AlertTriangle, CheckCircle2, Package, Hash, DollarSign, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { trpc } from "./trpc";

export default function OrderDetail() {
  const [, setLocation] = useLocation();
  
  // 1. IMPORTANTE: El nombre aquí debe ser idéntico al de App.tsx (:consecutivo)
  const [match, params] = useRoute("/provider/order/:consecutivo");
  const routeConsecutivo = params?.consecutivo;
  
  const [providerId, setProviderId] = useState<number | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("providerId");
    if (!id) {
      setLocation("/");
      return;
    }
    setProviderId(parseInt(id));
  }, [setLocation]);

  // 2. Llamamos al procedimiento que configuramos en el backend usando el consecutivo
  const { data: orderData, isLoading, error: queryError } = trpc.orders.getDetailsByConsecutivo.useQuery(
    { consecutivo: routeConsecutivo || "" },
    { 
      enabled: !!routeConsecutivo,
      keepPreviousData: false 
    }
  );

  useEffect(() => {
    if (orderData) {
      // Ajustamos para que 'order' sea el objeto de la orden
      const orderInfo = orderData.order || (Array.isArray(orderData) ? orderData[0] : orderData);
      setOrder(orderInfo);
    }
  }, [orderData]);

  const orderId = order?.id || null;
  // Usamos el consecutivo de la orden o el de la ruta como respaldo
  const currentConsecutivo = order?.consecutivo || routeConsecutivo;

  // Consultas adicionales basadas en el ID de la orden obtenido
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
      // Actualizamos el estado local con los nuevos datos devueltos
      if (data) setOrder(data);
      setError("");
      setShowSuccess(true);
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-600 font-medium">Cargando productos de la orden {routeConsecutivo}...</p>
      </div>
    );
  }

  if (queryError || !match || !routeConsecutivo || !providerId) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg inline-block">
          <p className="font-bold">Error al cargar detalles</p>
          <p className="text-sm">{queryError?.message || "Información de ruta no válida"}</p>
        </div>
        <Button className="mt-4 block mx-auto" onClick={() => setLocation("/provider/dashboard")}>
          Volver al Dashboard
        </Button>
      </div>
    );
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

  const items = orderData.items || (Array.isArray(orderData) ? orderData : []);

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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/provider/dashboard")} 
          className="mb-6 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
        </Button>

        {(error || queryError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || queryError?.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-none overflow-hidden">
              <CardHeader className="bg-white border-b py-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      <Package className="text-blue-600 w-8 h-8" />
                      Orden # {currentConsecutivo}
                    </CardTitle>
                    <CardDescription>{order.referencia || "Desglose de productos asociados a este consecutivo"}</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                      <span className="text-blue-700 font-bold text-sm">{items.length} Productos</span>
                    </div>
                    {getStatusBadge(order.estadoOrden)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Fecha</p>
                    <p className="font-semibold">{order.fecha ? format(new Date(order.fecha), "dd/MM/yyyy") : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Ciudad</p>
                    <p className="font-semibold">{order.ciudad || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Fecha de Entrega Estimada</p>
                    <p className="font-semibold">{order.fechaEstimadaEntrega ? format(new Date(order.fechaEstimadaEntrega), "dd/MM/yyyy") : "No especificada"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Estado de Entrega</p>
                    <p className="font-semibold">{order.estadoEntrega || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Notas</p>
                  <p className="font-semibold">{order.notas || "Sin notas"}</p>
                </div>
              </CardContent>
            </Card>

           <Card className="shadow-md border-none overflow-hidden">
  <CardHeader className="bg-slate-50/50 border-b">
    <CardTitle>Productos</CardTitle>
  </CardHeader>
  <CardContent className="p-0">
    {items.length === 0 ? (
      <div className="flex flex-col items-center gap-2 text-slate-400 py-20">
        <Package className="w-12 h-12 opacity-20" />
        <p>No hay productos vinculados a este número de orden.</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="pl-6"><Hash className="w-4 h-4 inline mr-1" /> Referencia</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Cantidad.</TableHead>
              <TableHead className="text-right">Precio Unitario</TableHead>
              <TableHead className="text-right">Total bruto</TableHead>
              <TableHead className="text-right">Impuestos.</TableHead>
              <TableHead className="text-right pr-6"><DollarSign className="w-4 h-4 inline mr-1" /> Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any, index: number) => (
              <TableRow key={item.id || index} className="hover:bg-slate-50 transition-colors border-b last:border-0">
                <TableCell className="font-bold pl-6 text-blue-600">{item.referencia}</TableCell>
                <TableCell className="text-slate-700 font-medium">{item.descripcion}</TableCell>
                <TableCell className="text-center">
                  <span className="bg-slate-100 px-2 py-1 rounded text-sm font-bold">
                    {item.cantidad}
                  </span>
                </TableCell>
                <TableCell className="text-right text-slate-600">
                  ${Number(item.precioUnitario).toLocaleString("es-CO")}
                </TableCell>
                {/* NUEVAS COLUMNAS POR FILA */}
                <TableCell className="text-right text-slate-600">
                  ${Number(item.valorBruto).toLocaleString("es-CO")}
                </TableCell>
                <TableCell className="text-right text-orange-600">
                  ${Number(item.impuestos).toLocaleString("es-CO")}
                </TableCell>
                <TableCell className="text-right font-black pr-6 text-slate-900">
                  ${Number(item.valorTotal).toLocaleString("es-CO")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
    
    {items.length > 0 && (
      <div className="p-6 bg-slate-900 text-white flex flex-col items-end gap-2">
        <div className="flex justify-between w-full max-w-[300px] text-slate-400 text-sm">
          <span>Total Bruto:</span>
          <span>${items.reduce((acc: number, item: any) => acc + Number(item.valorBruto), 0).toLocaleString("es-CO")}</span>
        </div>
        <div className="flex justify-between w-full max-w-[300px] text-orange-400 text-sm">
          <span>Total Impuestos:</span>
          <span>+ ${items.reduce((acc: number, item: any) => acc + Number(item.impuestos), 0).toLocaleString("es-CO")}</span>
        </div>
        <div className="flex justify-between w-full max-w-[300px] text-green-400 text-sm border-b border-slate-700 pb-2">
          <span>Dscto Global:</span>
          <span>- ${items.reduce((acc: number, item: any) => acc + Number(item.descuentoGlobal || 0), 0).toLocaleString("es-CO")}</span>
        </div>
        <div className="text-right mt-2">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total</p>
          <p className="text-4xl font-black text-white">
            ${items.reduce((acc: number, item: any) => acc + Number(item.valorTotal), 0).toLocaleString("es-CO")}
          </p>
        </div>
      </div>
    )}
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
                {(!order.numeroGuia || !order.numeroFactura) && !showSuccess && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Por favor completa los números de guía y factura
                    </AlertDescription>
                  </Alert>
                )}

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
                    if (!providerId || !currentConsecutivo) {
                      setError("Falta información de la orden o proveedor");
                      return;
                    }
                    setShowSuccess(false);
                    updateGuiaFacturaMutation.mutate({
                      consecutivo: String(currentConsecutivo), // Aseguramos que sea string y no undefined
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
                  <p className="font-semibold">{order.estadoEntrega || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
