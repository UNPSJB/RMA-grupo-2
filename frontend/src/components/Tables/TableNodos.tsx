import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Nodo {
  id: number;
  posicionX: number;
  posicionY: string;
}

const TableNodos: React.FC = () => {
  const [nodosData, setNodosData] = useState<Nodo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerNodos = async () => {
      try {
        const response = await axios.get('http://localhost:8000/nodo/');
        const nodos = response.data;
        setNodosData(nodos);
      } catch (error) {
        console.error('Error al obtener los nodos:', error);
        setError('Error al cargar los datos.');
      }
    };

    obtenerNodos();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (nodosData.length === 0) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Nodos de la red
      </h4>

      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Id</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">X</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Y</h5>
          </div>
        </div>

        {nodosData.map((data) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-5 border-b border-stroke dark:border-strokedark`}
            key={data.id}
          >
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{data.posicionX}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{new Date(data.posicionY).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableNodos;