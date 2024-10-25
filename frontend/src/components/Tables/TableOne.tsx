import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Medicion {
  id: number;
  nodo: number;
  tipo: string;
  dato: number;
  tiempo: string; // Cambia a string si viene como formato ISO
  bateria: string;
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
        Ultimas 5 Mediciones Recibidas
      </h4>

      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Nodo</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Fecha</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Temperatura (°C)</h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Humedad (%)</h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Estado</h5>
          </div>
        </div>

        {medicionData.map((data) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-5 border-b border-stroke dark:border-strokedark`}
            key={data.id}
          >
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{data.nodo}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{new Date(data.tiempo).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-meta-3">{data.dato =  Math.round(data.dato * 100) / 100}°C</p>
            </div>
            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">50</p> {/* Humedad aleatoria */}
            </div>
            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">{data.tipo}</p> {/* Mostrar tipo normalmente */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableOne;
