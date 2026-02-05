import { useRoute, useLocation } from "wouter";
import { trpc } from "./trpc"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { ArrowLeft, Package, Hash, DollarSign, Loader2 } from "lucide-react";

export default function OrderDetail() {
  const [, setLocation] = useLocation();
  
  // 1. IMPORTANTE: El nombre aquí debe ser idéntico al de App.tsx (:consecutivo)
  const [match, params] = useRoute("/provider/order/:consecutivo");
  const consecutivo = params?.consecutivo;

  // 2. Llamamos al procedimiento que configuramos en el backend
  const { data: items = [], isLoading, error } = trpc.orders.getDetailsByConsecutivo.useQuery(
    { consecutivo: consecutivo || "" },
    { 
      enabled: !!consecutivo,
      // Esto ayuda a que si cambias de orden, no veas los datos de la anterior un segundo
      keepPreviousData: false 
    }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-600 font-medium">Cargando productos de la orden {consecutivo}...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg inline-block">
          <p className="font-bold">Error al cargar detalles</p>
          <p className="text-sm">{error.message}</p>
        </div>
        <Button className="mt-4 block mx-auto" onClick={() => setLocation("/provider/dashboard")}>
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/provider/dashboard")} 
          className="mb-6 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
        </Button>

        <Card className="shadow-lg border-none overflow-hidden">
          <CardHeader className="bg-white border-b py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Package className="text-blue-600 w-8 h-8" />
                  Orden # {consecutivo}
                </CardTitle>
                <p className="text-slate-500 mt-1">Desglose de productos asociados a este consecutivo</p>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                <span className="text-blue-700 font-bold text-sm">{items.length} Productos detectados</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="pl-6 w-[150px]"><Hash className="w-4 h-4 inline mr-1" /> Referencia</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Precio Unitario</TableHead>
                    <TableHead className="text-right pr-6"><DollarSign className="w-4 h-4 inline mr-1" /> Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20">
                         <div className="flex flex-col items-center gap-2 text-slate-400">
                           <Package className="w-12 h-12 opacity-20" />
                           <p>No hay productos vinculados a este número de orden.</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item: any, index: number) => (
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
                        <TableCell className="text-right font-black pr-6 text-slate-900">
                          ${Number(item.valorTotal).toLocaleString("es-CO")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {items.length > 0 && (
              <div className="p-8 bg-slate-900 text-white flex justify-end">
                <div className="text-right">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total Consolidado</p>
                  <p className="text-4xl font-black">
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

