import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Filter, Download, BarChart3, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { isBefore, startOfDay } from "date-fns";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [filterProvider, setFilterProvider] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pendiente" | "confirmada" | "rechazada">("all");

  const { data: orders = [], isLoading } = trpc.admin.getAllOrders.useQuery({
    limit: 1000,
  });

  const { data: providers = [] } = trpc.admin.getProviders.useQuery();

  const { data: kpis } = trpc.admin.getKPIs.useQuery();

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchProvider = !filterProvider || 
        order.provider?.razonSocial?.toLowerCase().includes(filterProvider.toLowerCase()) ||
        order.provider?.nit?.includes(filterProvider);
      
      const orderDate = new Date(order.fecha);
      const matchStartDate = !filterStartDate || orderDate >= new Date(filterStartDate);
      const matchEndDate = !filterEndDate || orderDate <= new Date(filterEndDate);
      const matchStatus = filterStatus === "all" || order.estadoOrden === filterStatus;

      return matchProvider && matchStartDate && matchEndDate && matchStatus;
    });
  }, [orders, filterProvider, filterStartDate, filterEndDate, filterStatus]);

  // Calcular estadísticas de atrasadas
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

  const getDeliveryBadge = (status: string) => {
    switch (status) {
      case "entregada":
        return <Badge className="bg-blue-100 text-blue-800">Entregada</Badge>;
      case "no_entregada":
        return <Badge className="bg-gray-100 text-gray-800">No Entregada</Badge>;
      case "en_transito":
        return <Badge className="bg-purple-100 text-purple-800">En Transito</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const isOrderLate = (order: any) => {
    if (!order.fechaEstimadaEntrega) return false;
    const today = startOfDay(new Date());
    return isBefore(new Date(order.fechaEstimadaEntrega), today);
  };

  const handleExport = () => {
    const csv = [
      ["Consecutivo", "Proveedor", "Fecha", "Ciudad", "Cantidad", "Valor Total", "Estado", "Fecha Entrega"].join(","),
      ...filteredOrders.map((order: any) =>
        [
          order.consecutivo,
          order.provider?.razonSocial || "N/A",
          format(new Date(order.fecha), "dd/MM/yyyy"),
          order.ciudad,          
          order.cantidad,
          order.valorTotal,
          order.estadoOrden,
          order.fechaEstimadaEntrega ? format(new Date(order.fechaEstimadaEntrega), "dd/MM/yyyy") : "Sin fecha",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordenes-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Panel Administrativo</h1>
            <p className="text-slate-600 mt-2">Gestión completa de órdenes de compra</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Salir
            </Button>
            <Button variant="outline" onClick={() => setLocation("/admin/users")}>
              Usuarios
            </Button>
            <Button onClick={() => setLocation("/admin/kpis")}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver KPIs
            </Button>
          </div>
        </div>

        {/* KPI Cards - Actualizado con Atrasadas */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Ordenes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{kpis.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{stats.confirmadas}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendientes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">{stats.atrasadas}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${parseFloat(String(kpis.totalValue || 0)).toLocaleString("es-CO")}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Proveedor</label>
                <Input
                  placeholder="Buscar por NIT o razón social"
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Fecha Inicio</label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Fecha Fin</label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Estado</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleExport} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de ordenes */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes de Compra</CardTitle>
            <CardDescription>
              Mostrando {filteredOrders.length} de {orders.length} órdenes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Cargando órdenes...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-600">No hay órdenes que coincidan con los filtros</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consecutivo</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Ciudad</TableHead>
                      
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Entrega</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order: any) => (
                      <TableRow key={order.id} className={isOrderLate(order) ? "bg-red-50" : ""}>
                        <TableCell className="font-semibold">{order.consecutivo}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{order.provider?.razonSocial || "N/A"}</p>
                            <p className="text-sm text-slate-600">{order.provider?.nit || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(order.fecha), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{order.ciudad}</TableCell>
                        
                        <TableCell className="text-right">{order.cantidad}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${parseFloat(String(order.valorTotal)).toLocaleString("es-CO")}
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
