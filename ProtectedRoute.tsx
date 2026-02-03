import { useLocation } from "wouter";
import { trpc } from "./trpc";
import { useEffect } from "react";

export const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const [, setLocation] = useLocation();

  // Consultamos al servidor quién es el usuario actual
  const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000, // Evita peticiones repetitivas por 5 min
  });

  // 📝 LOGS DE SEGUIMIENTO (Revisar en F12 -> Console)
  useEffect(() => {
    if (!isLoading) {
      console.log("--- 🛡️ CHEQUEO DE RUTA PROTEGIDA ---");
      console.log("👤 Usuario:", user);
      console.log("🔑 Rol Detectado:", user?.role);
      console.log("❌ Error tRPC:", error);
    }
  }, [user, isLoading, error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  // Lógica de expulsión:
  // Si hay error, no hay usuario o el rol no es admin, lo mandamos al home
  if (error || !user || user.role !== 'admin') {
    console.warn("🚫 ACCESO DENEGADO. Redirigiendo al inicio...");
    // Usamos un pequeño delay para que wouter no se cruce con el renderizado
    setTimeout(() => setLocation("/"), 0);
    return null;
  }

  // Si pasa todas las pruebas, es Admin
  console.log("✅ ACCESO CONCEDIDO: Cargando Dashboard");
  return <Component {...rest} />;
};
