import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt from 'jsonwebtoken';

interface AuthContextType {
  token: string | null;
  role: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();
  
  
  // Cargar el token y el rol desde el localStorage al cargar la aplicación
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    if (savedToken) {
      setTokenState(savedToken);
      setRole(savedRole);
    }
  }, []);

  // Función para establecer el token y rol en el contexto y en localStorage
  const setToken = (token: string) => {
    if (token) {
    setTokenState(token);
    const decodedToken: any = jwt.decode(token);
    const userRole = decodedToken?.role; // Asegúrate de que el token contenga el rol
    setRole(userRole);
    localStorage.setItem('token', token);
    localStorage.setItem('role', userRole);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    setTokenState(null);
    setRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/'); // Redirige a la página de inicio de sesión
  };

  return (
    <AuthContext.Provider value={{ token, role, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para acceder al contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
