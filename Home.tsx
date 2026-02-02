import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { AlertCircle, Lock, User } from "lucide-react";
import { Alert, AlertDescription } from "./alert";
import { trpc } from "./trpc";

export default function Home() {
  const [, setLocation] = useLocation();

  // Login state
  const [nit, setNit] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const loginMutation = trpc.provider.login.useMutation({
    onSuccess: (data: any) => {
      // Guardamos la info básica
      localStorage.setItem("providerToken", data.token);
      localStorage.setItem("providerId", data.provider.id.toString());
      localStorage.setItem("providerNit", data.provider.nit);
      
      // Guardamos el rol para que el frontend sepa quién eres
      localStorage.setItem("userRole", data.provider.role || "provider");

      // Redirección inteligente:
      // Si el rol es 'admin', va a la consola de administración
      // De lo contrario, va a la vista de proveedor
      if (data.provider.role === 'admin') {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/provider/dashboard");
      }
    },
    onError: (err: any) => {
      setLoginError(err.message || "Error al iniciar sesión");
      setIsLoginLoading(false);
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);

    if (!nit.trim() || !password.trim()) {
      setLoginError("Por favor completa todos los campos");
      setIsLoginLoading(false);
      return;
    }

    loginMutation.mutate({ nit, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4" style={{ backgroundColor: '#f0f4ff' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/logo-simon-bolivar.png"
            alt="Simón Bolívar"
            className="h-50 w-auto"
          />
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-2 text-center" style={{ borderBottom: '3px solid #FFD400' }}>
            <CardTitle className="text-2xl font-bold" style={{ color: '#19287F' }}>
              Portal de Proveedores
            </CardTitle>
            <CardDescription className="text-gray-600">
              Acceso a órdenes de compra
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* NIT Input */}
              <div className="space-y-2">
                <Label htmlFor="nit" className="text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    NIT
                  </div>
                </Label>
                <Input
                  id="nit"
                  type="text"
                  placeholder="Ingresa tu NIT"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  disabled={isLoginLoading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Contraseña
                  </div>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoginLoading}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Error Alert */}
              {loginError && (
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    {loginError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoginLoading}
                className="w-full text-white font-medium py-2 rounded-lg transition-colors"
                style={{ backgroundColor: '#19287F' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0F1F5F')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#19287F')}
              >
                {isLoginLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                ¿Necesitas acceso? Contacta al administrador del sistema.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            <strong>Simón Bolívar</strong>
            <br />
            Todo para vehículos pesados
          </p>
        </div>
      </div>
    </div>
  );
}
