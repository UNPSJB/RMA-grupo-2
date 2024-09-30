import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Button from '@mui/material/Button';
import Home from './pages/Home'; // Importar el componente Home

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <>
        <div>
          <a href="https://vitejs.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Vite + React</h1>
        <div className="card">
          <Button variant="contained" onClick={() => setCount((count) => count + 1)}>
            Incrementar
          </Button>
          <p>Contador: {count}</p>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
          <Link to="/home">
            <Button variant="outlined">Ir a Home</Button>
          </Link>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>

        {/* Configuración de las Rutas */}
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
      </>
    </Router>
  );
}

export default App;
