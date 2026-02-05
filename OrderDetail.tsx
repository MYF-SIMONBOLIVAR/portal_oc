import { useRoute, useLocation } from "wouter";
import { trpc } from "./trpc"; // Ajusta la ruta a tu archivo trpc
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { ArrowLeft, Package, Hash, DollarSign } from "lucide-react";

export default function OrderDetail() {
  const [, setLocation] = useLocation();
  // 1. Obtenemos el consecutivo de la URL (ej: /provider/order/00012)
  const [match, params] = useRoute("/provider/order/:consecutivo");
  const consecutivo = params?.consecutivo;

  // 2. Llamamos al NUEVO procedimiento del router
  const { data: items = [], isLoading, error } = trpc.orders.getDetailsByConsecutivo.useQuery(
    { consecutivo: consecutivo || "" },
    { enabled: !!consecutivo }
  );

  if (isLoading) return <div className="p-8 text-center">Cargando detalles de la orden...</div>;
  
  if (error) return <div className="p-8 text-red-500 text-center">Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/provider/dashboard")} 
          className="mb-6 hover:bg-slate-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
        </Button>

        <Card className="shadow-lg border-none">
          <CardHeader className="bg-white border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Package className="text-blue-600" />
                  Orden de Compra: {consecutivo}
                </CardTitle>
                <p className="text-slate-500 mt-1">Lista de productos y cantidades solicitadas</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6"><Hash className="w-4 h-4 inline mr-1" /> Ref.</TableHead>
                  <TableHead>Descripción del Producto</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right pr-6"><DollarSign className="w-4 h-4 inline mr-1" /> Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                      No hay productos registrados para este consecutivo.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium pl-6 text-blue-700">{item.referencia}</TableCell>
                      <TableCell className="max-w-xs">{item.descripcion}</TableCell>
                      <TableCell className="text-center font-bold">{item.cantidad}</TableCell>
                      <TableCell className="text-right">
                        ${Number(item.precioUnitario).toLocaleString("es-CO")}
                      </TableCell>
                      <TableCell className="text-right font-bold pr-6">
                        ${Number(item.valorTotal).toLocaleString("es-CO")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Resumen al final de la tabla */}
            {items.length > 0 && (
              <div className="p-6 bg-slate-50 border-t flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Total de la Orden</p>
                  <p className="text-2xl font-black text-slate-900">
                    ${items.reduce((acc: number, item: any) => acc + Number(item.valorTotal), 0).toLocaleString("es-CO")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
