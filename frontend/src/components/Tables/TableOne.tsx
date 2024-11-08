import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Medicion {
  id: number;
  nodo: number;
  tipo: number; // Cambia a number para facilitar las comparaciones
  dato: number;
  tiempo: string; // Se usa formato ISO para facilitar el manejo de fechas
  error: boolean;
}

const TableOne: React.FC = () => {
  const [medicionData, setMedicionData] = useState<Medicion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const obtenerMediciones = async () => {
      try {
        const response = await axios.get('http://localhost:8000/medicion/');
        const mediciones = response.data;
        const ultimasCinco = mediciones
          .sort((a: Medicion, b: Medicion) => new Date(b.tiempo).getTime() - new Date(a.tiempo).getTime())
          .slice(0, 5);
        setMedicionData(ultimasCinco);
      } catch (error) {
        console.error('Error al obtener las mediciones:', error);
        setError('Error al cargar los datos.');
      }
    };

    obtenerMediciones();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (medicionData.length === 0) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Últimas 5 Mediciones Recibidas
      </h4>

      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Nodo</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Fecha</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Dato</h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Tipo</h5>
          </div>
        </div>

        {medicionData.map((item) => (
          <div
            className="grid grid-cols-3 sm:grid-cols-4 border-b border-stroke dark:border-strokedark"
            key={item.id}
          >
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{item.nodo}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">
                {new Date(item.tiempo).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-meta-3">
                {Math.round(item.dato * 100) / 100}
                {item.tipo === 1 || item.tipo === 2 ? ' °C' : item.tipo === 25 ? ' m' : ''}
              </p>
            </div>
            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">
                {item.tipo === 1 || item.tipo === 2 ? 'Temperatura' : item.tipo === 25 ? 'Altura' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableOne;
