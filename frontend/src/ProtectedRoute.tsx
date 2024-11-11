import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { token, role } = useAuth();
  // Si el usuario no está autenticado, redirige a la página de inicio de sesión
  if (!token) {
    alert("No se ha podido autenticar el usuario")
    return <Navigate to="/" />;
  }

  // Permitir acceso si el usuario tiene el rol requerido o es admin (para acceder a rutas de user)
  if (requiredRole && role !== requiredRole && role !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;