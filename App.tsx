import { Toaster } from "./sonner";
import { TooltipProvider } from ".tooltip";
import NotFound from "./NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./ErrorBoundary";
import { ThemeProvider } from "./ThemeContext";
import Home from "./pages/Home";
import ProviderDashboard from "./ProviderDashboard";
import OrderDetail from "./OrderDetail";
import AdminDashboard from "./AdminDashboard";
import AdminKPIs from "./AdminKPIs";
import AdminUsers from "./AdminUsers";

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
