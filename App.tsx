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

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/provider/dashboard"} component={ProviderDashboard} />
      <Route path={"/provider/order/:id"} component={OrderDetail} />
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/admin/kpis"} component={AdminKPIs} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      
      {/* Rutas de Proveedor (Públicas o podrías protegerlas luego también) */}
      <Route path={"/provider/dashboard"} component={ProviderDashboard} />
      <Route path={"/provider/order/:id"} component={OrderDetail} />

      {/* 🔐 Rutas Protegidas de Administrador */}
      <Route path="/admin/dashboard">
        {(params) => <ProtectedRoute component={AdminDashboard} params={params} />}
      </Route>
      
      <Route path="/admin/kpis">
        {(params) => <ProtectedRoute component={AdminKPIs} params={params} />}
      </Route>
      
      <Route path="/admin/users">
        {(params) => <ProtectedRoute component={AdminUsers} params={params} />}
      </Route>

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
