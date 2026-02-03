import { useLocation } from "wouter";
import { trpc } from "./trpc"; // O donde tengas tu instancia de trpc

export const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const [, setLocation] = useLocation();
  
  // Consultamos al servidor quién es el usuario actual
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) return <div>Validando credenciales...</div>;

  // Si no hay usuario o el rol NO es admin, lo mandamos al login de inmediato
  if (!user || user.role !== 'admin') {
    setLocation("/auth"); // O tu ruta de login
    return null;
  }

  // Si es admin, lo dejamos pasar
  return <Component {...rest} />;
};
