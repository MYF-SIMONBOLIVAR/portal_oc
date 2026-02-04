import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Badge } from "./badge";
import { AlertCircle, LogOut, Package, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "./alert";
import { trpc } from "./trpc";
import { format } from "date-fns";
import { isBefore, startOfDay } from "date-fns";

export default function ProviderDashboard() {
  const [, setLocation] = useLocation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [providerId, setProviderId] = useState<number | null>(null);
  const [providerName, setProviderName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("providerId");
    const name = localStorage.getItem("providerNit");
    if (!id || !name) {
      setLocation("/");
      return;
    }
    setProviderId(parseInt(id));
    setProviderName(name);
  }, [setLocation]);

  // 1. Traemos los datos crudos
  const { data: rawOrders = [], isLoading, refetch } = trpc.orders.myOrders.useQuery(
    { providerId: providerId || 0 },
    { enabled: !!providerId }
  );

  // 2. Agrupamos por consecutivo
  const groupedOrders = useMemo(() => {
    return rawOrders.reduce((acc: any[], current: any) => {
      const existingOrder = acc.find(o => o.consecutivo === current.consecutivo);
      if (existingOrder) {
        existingOrder.valorTotal = Number(existingOrder.valorTotal) + Number(current.valorTotal);
        existingOrder.items.push(current);
      } else {
        acc.push({
          ...current,
          valorTotal: Number(current.valorTotal),
          items: [current]
        });
      }
      return acc;
    }, []);
  }, [rawOrders]);

  // 3. Filtramos (usando la variable agrupada)
  const filteredOrders = useMemo(() => {
    return groupedOrders.filter((order: any) => {
      if (!order.fecha) return true;
      const orderDate = new Date(order.fecha);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && orderDate < start) return false;
      if (end && orderDate > end) return false;
      return true;
    });
  }, [groupedOrders, startDate, endDate]);

  const confirmMutation = trpc.orders.confirm.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => setError(err.message || "Error al confirmar orden"),
  });

  const rejectMutation = trpc.orders.reject.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => setError(err.message || "Error al rechazar orden"),
  });

  const handleConfirm = (id: number) => confirmMutation.mutate({ id });
  const handleReject = (id: number) => rejectMutation.mutate({ id });

  const isOrderLate = (order: any) => {
    if (!order.fechaEstimadaEntrega || order.estadoOrden === "confirmada") return false;
    return new Date(order.fechaEstimadaEntrega) < new Date();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente": return <Badge className="bg-yellow-100 text-yellow-800 border-none">Pendiente</Badge>;
      case "confirmada": return <Badge className="bg-green-100 text-green-800 border-none">Confirmada</Badge>;
      case "rechazada": return <Badge className="bg-red-100 text-red-800 border-none">Rechazada</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="font-bold text-xl text-slate-900">Portal Proveedores</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-medium">{providerName}</span>
            <Button variant="ghost" size="sm" onClick={() => { localStorage.clear(); setLocation("/"); }}>
              <LogOut className="w-4 h-4 mr-2" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Órdenes Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Cambiado orders por filteredOrders */}
              <div className="text-2xl font-bold">{filteredOrders.filter(o => o.estadoOrden === "pendiente").length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Órdenes de Compra</CardTitle>
            <CardDescription>Visualiza tus pedidos agrupados por consecutivo</CardDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            
            {isLoading ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 animate-spin mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500">Cargando información...</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[150px]">Consecutivo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Entrega</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-slate-500">No se encontraron registros</TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order: any) => (
                        <TableRow key={order.consecutivo} className={isOrderLate(order) ? "bg-red-50/50" : "hover:bg-slate-50/80 transition-colors"}>
                          <TableCell className="font-bold text-blue-700">
                            {order.consecutivo}
                            <div className="text-[10px] text-slate-400 font-normal">
                              {order.items.length} {order.items.length === 1 ? 'ítem' : 'ítems'}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {format(new Date(order.fecha), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900">
                            ${order.valorTotal.toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.estadoOrden)}</TableCell>
                          <TableCell>
                            {order.fechaEstimadaEntrega ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span className="text-sm">{format(new Date(order.fechaEstimadaEntrega), "dd/MM/yyyy")}</span>
                                {isOrderLate(order) && (
                                  <Badge className="bg-red-500 text-white text-[9px] px-1 h-4 border-none">ATRASADA</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Pendiente definir</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {order.estadoOrden === "pendiente" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-8 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleConfirm(order.id)}
                                    disabled={confirmMutation.isPending}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirmar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8"
                                    onClick={() => handleReject(order.id)}
                                    disabled={rejectMutation.isPending}
                                  >
                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
                                  </Button>
                                </>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8"
                                onClick={() => setLocation(`/provider/order/${order.consecutivo}`)}
                              >
                                Ver Detalles
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
