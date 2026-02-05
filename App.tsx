import { Toaster } from "./sonner";
import { TooltipProvider } from "./tooltip";
import NotFound from "./NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./ErrorBoundary";
import { ThemeProvider } from "./ThemeContext";
import Home from "./Home";
import ProviderDashboard from "./ProviderDashboard";
import OrderDetail from "./OrderDetail";
import AdminDashboard from "./AdminDashboard";
import AdminKPIs from "./AdminKPIs";
import AdminUsers from "./AdminUsers";
import { ProtectedRoute } from "./ProtectedRoute";

/**
 * Componente de Rutas (Renombrado para evitar conflictos con Vite/Esbuild)
 */
function AppRoutes() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      
      {/*  Rutas de Proveedor */}
      <Route path={"/provider/dashboard"} component={ProviderDashboard} />
      <Route path={"/provider/order/:consecutivo"} component={OrderDetail} />

      {/*  Rutas Protegidas de Administrador */}
      <Route path="/admin/dashboard">
        {(params) => <ProtectedRoute component={AdminDashboard} params={params} />}
      </Route>
      
      <Route path="/admin/kpis">
        {(params) => <ProtectedRoute component={AdminKPIs} params={params} />}
      </Route>
      
      <Route path="/admin/users">
        {(params) => <ProtectedRoute component={AdminUsers} params={params} />}
      </Route>

      {/*  Manejo de errores 404 */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 *  Componente Principal de la Aplicación
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {/* Llamamos al componente de rutas corregido */}
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
