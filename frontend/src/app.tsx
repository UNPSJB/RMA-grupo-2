import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import RMA from './pages/Dashboard/RMA';
import Perfil from './pages/Perfil';
import Settings from './pages/Settings';
import Tablas from './pages/Tablas';
import DefaultLayout from './layout/DefaultLayout';

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
    <DefaultLayout>
      <Routes>
        <Route
          index
          element={
            <>
              <PageTitle title="Iniciar Sesión" />
              <SignIn />
            </>
          }
        />
        <Route
          path="/auth/signup"
          element={
            <>
              <PageTitle title="Signup | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <SignUp />
            </>
          }
        />
        <Route
          path="user/perfil"
          element={
            <>
              <PageTitle title="Perfil | Red de Monitoreo Ambiental" />
              <Perfil />
            </>
          }
        />
        <Route
          path="user/tablas"
          element={
            <>
              <PageTitle title="Tablas | Red de Monitoreo Ambiental" />
              <Tablas />
            </>
          }
        />
        <Route
          path="/settings"
          element={
            <>
              <PageTitle title="Configuración" />
              <Settings />
            </>
          }
        />
        <Route
          path="user/RMA"
          element={
            <>
              <PageTitle title="Red de Monitoreo Ambiental" />
              <RMA />
            </>
          }
        />
      </Routes>
    </DefaultLayout>
  );
}

export default App;
