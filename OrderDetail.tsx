import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Input } from "./input";
import { ArrowLeft, FileText, Upload, Clock, CheckCircle, AlertCircle, AlertTriangle, CheckCircle2, Package, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { trpc } from "./trpc";

export default function OrderDetail() {
  const [, setLocation] = useLocation();
  // 1. Ajustado para usar :consecutivo como definimos en App.tsx
  const [match, params] = useRoute("/provider/order/:consecutivo");
  const consecutivoURL = params?.consecutivo;

  const [providerId, setProviderId] = useState<number | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
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

  // 2. Usamos el nuevo procedimiento que agrupa ítems por consecutivo
  const { data: itemsData, isLoading, error: trpcError } = trpc.orders.getDetailsByConsecutivo.useQuery(
    { consecutivo: consecutivoURL || "" },
    { enabled: !!consecutivoURL }
  );

  useEffect(() => {
    if (itemsData && itemsData.length > 0) {
      // Tomamos la información general del primer ítem encontrado
      setOrder(itemsData[0]);
      setItems(itemsData);
    }
  }, [itemsData]);

  // Nota: getAttachments y getHistory siguen necesitando un ID numérico. 
  // Se activarán solo cuando 'order' (cargado arriba) tenga un id válido.
  const { data: attachmentsData } = trpc.orders.getAttachments.useQuery(
    { orderId: order?.id || 0 },
    { enabled: !!order?.id }
  );

  const { data: historyData } = trpc.orders.getHistory.useQuery(
    { orderId: order?.id || 0 },
    { enabled: !!order?.id }
  );

  useEffect(() => { if (attachmentsData) setAttachments(attachmentsData); }, [attachmentsData]);
  useEffect(() => { if (historyData) setHistory(historyData); }, [historyData]);

  const confirmMutation = trpc.orders.confirm.useMutation({
    onSuccess: () => window.location.reload(),
    onError: (err) => setError(err.message || "Error al confirmar orden"),
  });

  const updateGuiaFacturaMutation = trpc.orders.updateGuiaAndFactura.useMutation({
    onSuccess: (data) => {
      setOrder(data);
      setError("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    },
    onError: (err) => {
      setError(err.message || "Error al guardar información");
      setShowSuccess(false);
    },
  });

  const handleConfirm = () => {
    if (!order?.id || !providerId) return;
    confirmMutation.mutate({ orderId: order.id, providerId });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-600">Cargando detalles de la orden {consecutivoURL}...</p>
      </div>
    );
  }

  if (!order && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <Package className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-600 mb-4">No se encontraron datos para la orden {consecutivoURL}</p>
        <Button variant="outline" onClick={() => setLocation("/provider/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmada": return <Badge className="bg-green-100 text-green-800">Confirmada</Badge>;
      case "pendiente": return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case "rechazada": return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => setLocation("/provider/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Mis Ordenes
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Cabecera de la Orden */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">Orden {order.consecutivo}</CardTitle>
                    <CardDescription>{order.referencia || "Sin referencia de cabecera"}</CardDescription>
                  </div>
                  <div>{getStatusBadge(order.estadoOrden)}</div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Fecha Emisión</p>
                    <p className="font-medium">{format(new Date(order.fecha), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Ciudad</p>
                    <p className="font-medium">{order.ciudad}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Entrega Estimada</p>
                    <p className="font-medium">{order.fechaEstimadaEntrega ? format(new Date(order.fechaEstimadaEntrega), "dd/MM/yyyy") : "Pendiente"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Estado Entrega</p>
                    <p className="font-medium capitalize">{order.estadoEntrega?.replace('_', ' ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Productos Consolidada */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Productos Detallados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Precio Unit.</TableHead>
                        <TableHead className="text-right font-bold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-bold text-blue-700">{item.referencia}</TableCell>
                          <TableCell className="text-sm">{item.descripcion}</TableCell>
                          <TableCell className="text-right font-medium">{parseFloat(String(item.cantidad)).toLocaleString("es-CO")}</TableCell>
                          <TableCell className="text-right">${parseFloat(String(item.precioUnitario)).toLocaleString("es-CO")}</TableCell>
                          <TableCell className="text-right font-bold">${parseFloat(String(item.valorTotal)).toLocaleString("es-CO")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Resumen Financiero Agrupado */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Resumen de Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold">${items.reduce((acc, i) => acc + parseFloat(String(i.valorTotal - i.impuestos)), 0).toLocaleString("es-CO")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Impuestos (19%)</span>
                    <span className="font-semibold">${items.reduce((acc, i) => acc + parseFloat(String(i.impuestos)), 0).toLocaleString("es-CO")}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t text-xl font-black">
                    <span>TOTAL CONSOLIDADO</span>
                    <span className="text-blue-600">${items.reduce((acc, i) => acc + parseFloat(String(i.valorTotal)), 0).toLocaleString("es-CO")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Lateral: Acciones e Información de Envío */}
          <div className="space-y-4">
            {order.estadoOrden === "pendiente" && (
              <Card className="border-yellow-200 bg-yellow-50/30">
                <CardHeader>
                  <CardTitle className="text-base">Acciones Requeridas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleConfirm}
                    disabled={confirmMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 font-bold"
                  >
                    {confirmMutation.isPending ? "Procesando..." : "Confirmar Recepción"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Logística y Facturación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 font-medium">Datos actualizados</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Número de Guía</label>
                  <Input 
                    placeholder="Eje: 1234567" 
                    defaultValue={order.numeroGuia || ""}
                    onChange={(e) => setOrder({ ...order, numeroGuia: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Número de Factura</label>
                  <Input 
                    placeholder="Eje: FAC-001" 
                    defaultValue={order.numeroFactura || ""}
                    onChange={(e) => setOrder({ ...order, numeroFactura: e.target.value })}
                  />
                </div>

                <Button
                  onClick={() => {
                    if (!providerId || !order.id) return;
                    updateGuiaFacturaMutation.mutate({
                      orderId: order.id,
                      providerId,
                      numeroGuia: order.numeroGuia || null,
                      numeroFactura: order.numeroFactura || null,
                    });
                  }}
                  disabled={updateGuiaFacturaMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {updateGuiaFacturaMutation.isPending ? "Guardando..." : "Guardar Información"}
                </Button>
              </CardContent>
            </Card>

            {/* Documentos Adjuntos */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" /> Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No hay archivos cargados</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att: any) => (
                      <div key={att.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm">
                        <span className="truncate max-w-[150px]">{att.nombreArchivo}</span>
                        <Button size="sm" variant="ghost" className="h-7 text-blue-600">Ver</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
