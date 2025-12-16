import React, { useEffect, useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import TableNodos from '../../components/Tables/TableNodos';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Nodo {
  id: number;
  nombre: string;
  posicionx: number;
  posiciony: number;
  descripcion: string;
  cuenca_id?: number;
  es_movil?: boolean;
}

const PanelNodos = () => {
  const navigate = useNavigate();
  const [nodos, setNodos] = useState<Nodo[]>([]);

  const handleCreateNodo = () => {
    navigate('/admin/crear-nodo');
  };
  
  const obtenerNodos = async () => {
    try {
      const response = await axios.get('http://localhost:8000/nodos/');
      setNodos(response.data);
    } catch (error) {
      console.error('Error al obtener los nodos:', error);
    }
  };

  useEffect(() => {
    obtenerNodos();
  }, []);
  
  
  return (
    <>
      <Breadcrumb pageName="Nodos" />

      <div className="mb-4">
        <button
          onClick={handleCreateNodo}
          className="bg-green-500 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Nodo
        </button>
      </div>

      <TableNodos nodos={nodos} setNodos={setNodos} />
    </>
  );
};
export default PanelNodos;
