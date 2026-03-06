import { useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle } from "lucide-react";
import { trpc } from "./trpc";

export default function Home() {
  const [, setLocation] = useLocation();

  // Estados de Login
  const [nit, setNit] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const loginMutation = trpc.provider.login.useMutation({
    onSuccess: (data: any) => {
      // Guardar sesión
      localStorage.setItem("providerToken", data.token);
      localStorage.setItem("providerId", data.provider.id.toString());
      localStorage.setItem("providerNit", data.provider.nit);
      localStorage.setItem("userRole", data.provider.role || "provider");

      // Redirección por rol
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
    <div className="login-wrapper">
      {/* 1. Fondo de Video (Z-INDEX 1) */}
      <video className="video-background" autoPlay muted loop playsInline>
        <source src="/fondo-mula.mp4" type="video/mp4" />
      </video>
      
      {/* 2. Overlay Oscuro (Z-INDEX 2) */}
      <div className="overlay-dark"></div>

      {/* 3. Contenedor de Contenido (Z-INDEX 3) */}
      <div className="login-container">
        
        {/* Branding Section */}
        <div className="brand-section">
          <h1 className="brand-title">PORTAL PROVEEDORES</h1>
          <p className="brand-subtitle">Repuestos SIMÓN BOLÍVAR</p>
        </div>

        {/* Glassmorphism Card */}
        <div className="login-card">
          <div className="form-title">
            <h2>Bienvenido</h2>
            <p>Ingresa tus datos de acceso</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="form-group">
              <label className="form-label">NIT</label>
              <input
                type="text"
                placeholder="Ingresa tu NIT"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                disabled={isLoginLoading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoginLoading}
                className="form-input"
              />
            </div>

            {loginError && (
              <div className="error-message flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoginLoading}
             
              className="submit-btn mt-4"
            >
              {isLoginLoading ? "VERIFICANDO..." : "INGRESAR"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2026 Repuestos Simón Bolívar | Todos los derechos reservados</p>
        </div>
      </div>

      {/* Estilos CSS Inyectados */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.cdnfonts.com/css/futura-pt');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .login-wrapper {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          overflow: hidden;
          font-family: 'Futura PT', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-background {
          position: absolute;
          top: 50%; left: 50%;
          min-width: 100%; min-height: 100%;
          width: auto; height: auto;
          transform: translate(-50%, -50%);
          object-fit: cover;
          z-index: 1;
        }

        .overlay-dark {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(25, 40, 127, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%);
          z-index: 2;
        }

        .login-container {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
          width: 100%;
          max-width: 1200px;
          padding: 20px;
        }

        .brand-section {
          text-align: center;
          animation: fadeInDown 0.8s ease-out;
        }

        .brand-title {
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          font-weight: 900;
          color: #FFD400;
          text-transform: uppercase;
          letter-spacing: 5px;
          text-shadow: 3px 3px 15px rgba(0, 0, 0, 0.7);
        }

        .brand-subtitle {
          font-size: 1.5rem;
          color: white;
          letter-spacing: 4px;
          text-transform: uppercase;
          text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.5);
        }

        .login-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 30px;
          padding: 3rem;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 15px 45px rgba(0, 0, 0, 0.4);
          animation: fadeInUp 0.8s ease-out;
        }

        .form-title h2 {
          font-size: 2.2rem;
          color: white;
          font-weight: 800;
          text-align: center;
          text-transform: uppercase;
        }

        .form-title p {
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-label {
          display: block;
          color: #FFD400;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .form-input {
          width: 100%;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          color: white;
          font-size: 1.1rem;
          transition: all 0.3s;
        }

        .form-input:focus {
          outline: none;
          border-color: #FFD400;
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 15px rgba(255, 212, 0, 0.3);
        }

        .submit-btn {
          width: 100%;
          padding: 1.2rem;
          background: #FFD400;
          color: #19287F;
          border: none;
          border-radius: 12px;
          font-size: 1.2rem;
          font-weight: 800;
          text-transform: uppercase;
          cursor: pointer;
          transition: 0.3s;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          background: white;
          box-shadow: 0 8px 20px rgba(255, 212, 0, 0.4);
        }

        .error-message {
          background: rgba(255, 59, 48, 0.3);
          border: 1px solid #ff3b30;
          padding: 0.8rem;
          border-radius: 12px;
          color: white;
          font-size: 0.9rem;
        }

        .login-footer {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          text-align: center;
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
