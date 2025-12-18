import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { token, role } = useAuth();
  const location = useLocation();

  // Si el usuario no está autenticado, redirige a la página de inicio de sesión
  if (!token) {
    return <Navigate to="/" />;
  }

  // Si no se requiere un rol específico, permitir acceso a cualquier usuario autenticado
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Permitir acceso si el usuario tiene el rol requerido o es admin (para acceder a rutas de user)
  if (role === requiredRole || role === 'admin') {
    return <>{children}</>;
  }

  // Si el usuario no tiene permisos, redirigir a su página principal según su rol
  // En lugar de ir a /unauthorized, redirigir a su vista correspondiente
  if (role === 'investigador') {
    return <Navigate to="/user/RMA" replace />;
  } else if (role === 'usuario') {
    return <Navigate to="/invitado/RMA" replace />;
  }

  // Si no se reconoce el rol, ir a unauthorized
  return <Navigate to="/unauthorized" state={{ from: location }} replace />;
};

export default ProtectedRoute;