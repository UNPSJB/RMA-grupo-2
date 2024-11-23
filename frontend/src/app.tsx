import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Loader from './common/Loader';
import SignIn from './pages/Authentication/SignIn';
import Unauthorized from './pages/Authentication/Unauthorized';
import SignUp from './pages/Authentication/SignUp';
import RMA from './pages/Investigador/RMA';
import Settings from './pages/Settings';
import Tablas from './pages/Investigador/Tablas';
import InvestigadorLayout from './layout/InvestigadorLayout';
import AuthLayout from './layout/AuthLayout';
import PanelNodos from './pages/Admin/PanelNodos';
import PanelUsuarios from './pages/Admin/PanelUsuarios';
import AdminMain from './pages/Admin/AdminMain';
import ProtectedRoute from './ProtectedRoute'; // Importa ProtectedRoute
import AdminLayout from './layout/AdminLayout';
import PanelAlarmas from './pages/Admin/PanelAlarmas';
import DefaultLayout from './layout/DefaultLayout';
import PaginaDefault from './pages/DefaultView/PaginaDefault';
import CrearNodo from './pages/Admin/CrearNodo'

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <Routes>
      {/* Rutas públicas con AuthLayout para SignIn y SignUp */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Route>

      {/* Rutas protegidas con InvestigadorLayout */}
      <Route element={<InvestigadorLayout />}>
        {/* Ruta protegida para usuarios con rol 'user' */}
        <Route path="/user/RMA" element={
          <ProtectedRoute requiredRole="investigador">
            <RMA />
          </ProtectedRoute>
        }/>
        
        {/* Ruta protegida para usuarios con rol 'user' */}
        <Route path="/user/tablas" element={
          <ProtectedRoute requiredRole="investigador">
            <Tablas />
          </ProtectedRoute>
        }/>

        {/* Ruta protegida para administradores */}
      </Route>
      <Route element={<AdminLayout/>}>
        <Route path="/admin/RMA" element={
          <ProtectedRoute requiredRole="admin">
            <RMA />
          </ProtectedRoute>
        }/>
        <Route path="/admin/nodos" element={
          <ProtectedRoute requiredRole="admin">
            <PanelNodos />
          </ProtectedRoute>
        }/>
         <Route path="/admin/crear-nodo" element={
          <ProtectedRoute requiredRole="admin">
            <CrearNodo />
          </ProtectedRoute>
         }/>
        
        <Route path="/admin/usuarios" element={
          <ProtectedRoute requiredRole="admin">
            <PanelUsuarios />
          </ProtectedRoute>
        }/>

        <Route path="/admin/alarmas" element={
          <ProtectedRoute requiredRole="admin">
            <PanelAlarmas />
          </ProtectedRoute>
        }/>
        
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminMain />
          </ProtectedRoute>
        }/>

        {/* Ruta accesible para cualquier usuario autenticado */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }/>
        <Route path="/RMAinvitado" element={
          <ProtectedRoute>
            <PaginaDefault />
          </ProtectedRoute>
        }/>
      </Route>
    </Routes>
  );
}

export default App;