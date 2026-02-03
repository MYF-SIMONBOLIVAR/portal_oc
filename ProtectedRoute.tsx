import { useLocation } from "wouter";
import { trpc } from "./trpc"; 

export const ProtectedRoute = ({ component: Component, ...rest }: any) => {
  const [, setLocation] = useLocation();
  
  
  const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600 animate-pulse">Verificando acceso...</p>
      </div>
    );
  }

 
  if (error || !user || user.role !== 'admin') {
    setTimeout(() => setLocation("/"), 0); 
    return null;
  }

  return <Component {...rest} />;
};
