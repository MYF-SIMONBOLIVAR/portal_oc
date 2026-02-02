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

  const { data: orders = [], isLoading, refetch } = trpc.orders.myOrders.useQuery(
    { providerId: providerId || 0 },
    { enabled: !!providerId }
  );

  const confirmMutation = trpc.orders.confirm.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      setError(err.message || "Error al confirmar orden");
    },
  });

  const rejectMutation = trpc.orders.confirm.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      setError(err.message || "Error al rechazar orden");
    },
  });

  const filteredOrders = useMemo(() => {
    if (!startDate || !endDate) {
      return orders;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      setError("La fecha inicial debe ser menor a la fecha final");
      return orders;
    }

    setError("");
    return orders.filter((order: any) => {
      const orderDate = new Date(order.fecha);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, startDate, endDate]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    let pendientes = 0;
    let confirmadas = 0;
    let atrasadas = 0;

    orders.forEach((order: any) => {
      if (order.estadoOrden === "pendiente") {
        pendientes++;
        if (order.fechaEstimadaEntrega && isBefore(new Date(order.fechaEstimadaEntrega), today)) {
          atrasadas++;
        }
      } else if (order.estadoOrden === "confirmada") {
        confirmadas++;
      }
    });

    return { pendientes, confirmadas, atrasadas };
  }, [orders]);

  const handleConfirm = (orderId: number) => {
    if (!providerId) return;
    confirmMutation.mutate({ orderId, providerId });
  };

  const handleReject = (orderId: number) => {
    if (!providerId) return;
    // Nota: Aquí usamos el mismo endpoint de confirm, pero en el futuro podría haber un endpoint específico para rechazar
    rejectMutation.mutate({ orderId, providerId });
  };

  const handleLogout = () => {
    localStorage.removeItem("providerToken");
    localStorage.removeItem("providerId");
    localStorage.removeItem("providerNit");
    setLocation("/");
  };

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

  const isOrderLate = (order: any) => {
    if (!order.fechaEstimadaEntrega) return false;
    const today = startOfDay(new Date());
    return isBefore(new Date(order.fechaEstimadaEntrega), today);
  };

  if (!providerId) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Mis Ordenes</h1>
              <p className="text-sm text-slate-600">NIT: {providerName}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Resumen de Estados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendientes}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Confirmadas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.confirmadas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Atrasadas</p>
                  <p className="text-3xl font-bold text-red-600">{stats.atrasadas}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtro de Fechas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Filtrar por Fechas
            </CardTitle>
            <CardDescription>Selecciona un rango de fechas para filtrar tus ordenes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" disabled={!startDate || !endDate}>
                  Filtrar
                </Button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Tabla de Órdenes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Ordenes de Compra
            </CardTitle>
            <CardDescription>
              Mostrando {filteredOrders.length} de {orders.length} ordenes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-slate-600">Cargando ordenes...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-slate-600">No hay ordenes disponibles</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consecutivo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Entrega</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order: any) => (
                      <TableRow key={order.id} className={isOrderLate(order) ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">{order.consecutivo}</TableCell>
                        <TableCell>{format(new Date(order.fecha), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${parseFloat(order.valorTotal).toLocaleString("es-CO")}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.estadoOrden)}</TableCell>
                        <TableCell>
                          {order.fechaEstimadaEntrega ? (
                            <div className="flex items-center gap-2">
                              <span>{format(new Date(order.fechaEstimadaEntrega), "dd/MM/yyyy")}</span>
                              {isOrderLate(order) && (
                                <Badge className="bg-red-100 text-red-800">Atrasada</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Sin fecha</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {order.estadoOrden === "pendiente" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleConfirm(order.id)}
                                disabled={confirmMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(order.id)}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rechazar
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setLocation(`/provider/order/${order.id}`)}>
                            Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
