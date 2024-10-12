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
import Temperaturas from './pages/Dashboard/RMAList';

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
        <Route path="/" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/user/RMA" element={<RMA />} />
        <Route path="/user/tablas" element={<Tablas />} />
        <Route path="/user/perfil" element={<Perfil />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </DefaultLayout>
  );
}

export default App;
