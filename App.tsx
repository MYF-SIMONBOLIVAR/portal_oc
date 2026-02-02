import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProviderDashboard from "./pages/ProviderDashboard";
import OrderDetail from "./pages/OrderDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminKPIs from "./pages/AdminKPIs";
import AdminUsers from "./pages/AdminUsers";

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

export default App;
