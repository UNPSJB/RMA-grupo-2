import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
//import { AuthProvider } from 'AuthContext';
import Loader from './common/Loader';
//import PageTitle from './components/PageTitle';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import RMA from './pages/Investigador/RMA';
//import Perfil from './pages/Perfil';
import Settings from './pages/Settings';
import Tablas from './pages/Tablas';
import DefaultLayout from './layout/DefaultLayout';
import AuthLayout from './layout/AuthLayout';
import PanelNodos from './pages/Admin/PanelNodos'
import PanelUsuarios from './pages/Admin/PanelUsuarios';
import AdminMain from './pages/Admin/AdminMain';
import AdminLayout from './layout/AdminLayout';

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
      {/* Rutas con AuthLayout para SignIn y SignUp */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
      </Route>

      {/* Rutas con DefaultLayout para páginas de usuario */}
      <Route element={<DefaultLayout />}>
        <Route path="/user/RMA" element={<RMA />} />
        <Route path="/user/tablas" element={<Tablas />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route element={<AdminLayout/>}>
        <Route path="/admin/nodos" element={<PanelNodos />} />
        <Route path="/admin/usuarios" element={<PanelUsuarios />} />
        <Route path="/admin" element={<AdminMain />} />
      </Route>
    </Routes>
  );
}

export default App;
