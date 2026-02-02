import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { ArrowLeft, TrendingUp, Calendar, Users, DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Badge } from "./badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { trpc } from "./trpc";

export default function AdminKPIs() {
  const [, setLocation] = useLocation();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: kpis } = trpc.admin.getKPIs.useQuery();
  const { data: orders = [] } = trpc.admin.getAllOrders.useQuery({ limit: 1000 });

  // Filtrar órdenes por rango de fechas
  const filteredOrders = useMemo(() => {
    if (!startDate && !endDate) return orders;
    
    return orders.filter((order: any) => {
      const orderDate = new Date(order.fecha);
      const start = startDate ? new Date(startDate) : new Date("1900-01-01");
      const end = endDate ? new Date(endDate) : new Date("2100-12-31");
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, startDate, endDate]);

  // Calcular datos para gráficos basados en órdenes filtradas
  const ordersByStatus = useMemo(() => {
    const confirmed = filteredOrders.filter((o: any) => o.estadoOrden === 'confirmada').length;
    const pending = filteredOrders.filter((o: any) => o.estadoOrden === 'pendiente').length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const late = filteredOrders.filter((o: any) => {
      if (!o.fechaEstimadaEntrega) return false;
      const deliveryDate = new Date(o.fechaEstimadaEntrega);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate < today && o.estadoOrden === 'pendiente';
    }).length;
    
    return [
      { name: "Confirmadas", value: confirmed, fill: "#19287F" },
      { name: "Pendientes", value: pending, fill: "#FFD400" },
      { name: "Atrasadas", value: late, fill: "#FF1B1C" },
    ];
  }, [filteredOrders]);

  // Gráfico de barras por proveedor
  const providerBarChart = useMemo(() => {
    const providerStats: any = {};
    filteredOrders.forEach((o: any) => {
      const providerId = o.providerId;
      if (!providerStats[providerId]) {
        providerStats[providerId] = {
          name: o.provider?.razonSocial || 'Desconocido',
          ordenes: 0,
          valor: 0
        };
      }
      providerStats[providerId].ordenes++;
      providerStats[providerId].valor += parseFloat(String(o.valorTotal || 0));
    });
    return Object.values(providerStats).sort((a: any, b: any) => b.valor - a.valor);
  }, [filteredOrders]);

  // Transformar tendencias mensuales para gráfico (basado en órdenes filtradas)
  const monthlyTrendsChart = useMemo(() => {
    const monthlyTrends: any = {};
    filteredOrders.forEach((o: any) => {
      const date = new Date(o.fecha);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const providerId = o.providerId;
      
      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = {};
      }
      if (!monthlyTrends[monthKey][providerId]) {
        monthlyTrends[monthKey][providerId] = {
          name: o.provider?.razonSocial || 'Desconocido',
          count: 0
        };
      }
      monthlyTrends[monthKey][providerId].count++;
    });
    
    const months = Object.keys(monthlyTrends).sort();
    return months.map(month => {
      const monthData: any = { month };
      Object.values(monthlyTrends[month] || {}).forEach((provider: any) => {
        monthData[provider.name] = provider.count;
      });
      return monthData;
    });
  }, [filteredOrders]);

  // Calcular métricas basadas en órdenes filtradas
  const totalFiltered = filteredOrders.length;
  const confirmedFiltered = filteredOrders.filter((o: any) => o.estadoOrden === 'confirmada').length;
  const pendingFiltered = filteredOrders.filter((o: any) => o.estadoOrden === 'pendiente').length;
  const totalValueFiltered = filteredOrders.reduce((sum: number, o: any) => sum + parseFloat(String(o.valorTotal || 0)), 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lateOrdersFiltered = filteredOrders.filter((o: any) => {
    if (!o.fechaEstimadaEntrega) return false;
    const deliveryDate = new Date(o.fechaEstimadaEntrega);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate < today && o.estadoOrden === 'pendiente';
  });
  const lateCountFiltered = lateOrdersFiltered.length;
  const latePercentageFiltered = totalFiltered > 0 ? Math.round((lateCountFiltered / totalFiltered) * 100) : 0;
  
  const confirmationRate = totalFiltered > 0
    ? Math.round((confirmedFiltered / totalFiltered) * 100)
    : 0;

  const colors = ["#19287F", "#8D9EBC", "#f59e0b", "#FF1B1C", "#341293"];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard de KPIs Avanzados</h1>
            <p className="text-slate-600 mt-2">Análisis detallado de entregas y cumplimiento</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/admin/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Filtro de Fechas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Filtro de Fechas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Fecha Inicio</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Fecha Fin</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="w-full"
                >
                  Limpiar Filtro
                </Button>
              </div>
            </div>
            {(startDate || endDate) && (
              <p className="text-sm text-slate-600 mt-4">
                Mostrando {totalFiltered} órdenes {startDate && `desde ${startDate}`} {endDate && `hasta ${endDate}`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* KPI Cards - Fila 1 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Total Órdenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalFiltered}</p>
              <p className="text-xs text-slate-600 mt-2">En el período seleccionado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Confirmadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{confirmedFiltered}</p>
              <p className="text-xs text-slate-600 mt-2">{confirmationRate}% de cumplimiento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{pendingFiltered}</p>
              <p className="text-xs text-slate-600 mt-2">Requieren confirmación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{lateCountFiltered}</p>
              <p className="text-xs text-slate-600 mt-2">{latePercentageFiltered}% del total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${parseFloat(String(totalValueFiltered)).toLocaleString("es-CO", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-slate-600 mt-2">En el período</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
              <CardDescription>Órdenes confirmadas, pendientes y atrasadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#19287F"
                    dataKey="value"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Barras por Proveedor */}
          <Card>
            <CardHeader>
              <CardTitle>Volumen por Proveedor</CardTitle>
              <CardDescription>Órdenes y valor total por proveedor</CardDescription>
            </CardHeader>
            <CardContent>
              {providerBarChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={providerBarChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="ordenes" fill="#19287F" name="Órdenes" />
                    <Bar yAxisId="right" dataKey="valor" fill="#FFD400" name="Valor (x1000)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-600 text-center py-8">Sin datos disponibles</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tendencias por Mes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tendencias por Mes y Proveedor</CardTitle>
            <CardDescription>Cantidad de órdenes por mes</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrendsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.keys(monthlyTrendsChart[0] || {})
                    .filter(key => key !== 'month')
                    .map((provider, idx) => (
                      <Line
                        key={provider}
                        type="monotone"
                        dataKey={provider}
                        stroke={colors[idx % colors.length]}
                        name={provider}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-600 text-center py-8">Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Tabla de Cumplimiento por Proveedor */}
        <Card>
          <CardHeader>
            <CardTitle>Cumplimiento por Proveedor</CardTitle>
            <CardDescription>Métricas detalladas de cada proveedor</CardDescription>
          </CardHeader>
          <CardContent>
            {kpis?.providerMetrics && kpis.providerMetrics.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>NIT</TableHead>
                      <TableHead className="text-center">Total Órdenes</TableHead>
                      <TableHead className="text-center">% Cumplimiento</TableHead>
                      <TableHead className="text-center">% Atrasadas</TableHead>
                      <TableHead className="text-center">Retraso Promedio (días)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.providerMetrics.map((provider: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold">{provider.name}</TableCell>
                        <TableCell>{provider.nit}</TableCell>
                        <TableCell className="text-center">{provider.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              provider.compliance >= 80
                                ? "bg-green-100 text-green-800"
                                : provider.compliance >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {provider.compliance}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              provider.latePercentage === 0
                                ? "bg-green-100 text-green-800"
                                : provider.latePercentage <= 20
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {provider.latePercentage}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {provider.avgDaysLate > 0 ? (
                            <span className="font-semibold text-red-600">{provider.avgDaysLate} días</span>
                          ) : (
                            <span className="text-green-600">0 días</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
