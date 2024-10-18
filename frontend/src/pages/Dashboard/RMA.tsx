import React, { useEffect, useState } from 'react';
import CardDataStats from '../../components/CardDataStats';
import ChartOne from '../../components/Charts/ChartOne';
import ChartTwo from '../../components/Charts/ChartTwo';
import ChatCard from '../../components/Chat/ChatCard';
import TableOne from '../../components/Tables/TableOne';
import ChartLineaTemp from '../../components/Charts/ChartLineaTemp';

const RMA: React.FC = () => {
  const [ultimaTemperatura, setUltimaTemperatura] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const obtenerUltimaTemperatura = async () => {
    try {
      const response = await fetch('http://localhost:8000/temperatura/');
      const data = await response.json();

      if (data.length === 0) return null;

      const ultimaTemp = data.reduce((prev, current) => 
        new Date(prev.tiempo) > new Date(current.tiempo) ? prev : current
      );

      return ultimaTemp.dato = data.dato =  Math.round(ultimaTemp.dato * 100) / 100; // Retorna el valor de "dato"
    } catch (error) {
      console.error('Error al obtener la última temperatura:', error);
      setError('Error al cargar la última temperatura.');
      return null;
    }
  };

  useEffect(() => {
    const fetchUltimaTemperatura = async () => {
      const ultimaTemp = await obtenerUltimaTemperatura();
      setUltimaTemperatura(ultimaTemp);
    };

    fetchUltimaTemperatura(); // Inicializa la primera carga

    const intervalId = setInterval(fetchUltimaTemperatura, 60000); // Actualiza cada 10 minutos (600,000 ms)

    return () => clearInterval(intervalId); // Limpia el intervalo al desmontar el componente
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <CardDataStats 
          title="Última temperatura registrada" 
          total={ultimaTemperatura !== null ? `${ultimaTemperatura}°C` : 'Cargando...'} 
          rate="1,5ºC" 
          levelUp
        >
          <svg
            className="fill-primary dark:fill-white"
            width="22"
            height="16"
            viewBox="0 0 22 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 15.1156C4.19376 15.1156 0.825012 8.61876 0.687512 8.34376C0.584387 8.13751 0.584387 7.86251 0.687512 7.65626C0.825012 7.38126 4.19376 0.918762 11 0.918762C17.8063 0.918762 21.175 7.38126 21.3125 7.65626C21.4156 7.86251 21.4156 8.13751 21.3125 8.34376C21.175 8.61876 17.8063 15.1156 11 15.1156ZM2.26876 8.00001C3.02501 9.27189 5.98126 13.5688 11 13.5688C16.0188 13.5688 18.975 9.27189 19.7313 8.00001C18.975 6.72814 16.0188 2.43126 11 2.43126C5.98126 2.43126 3.02501 6.72814 2.26876 8.00001Z"
              fill=""
            />
            <path
              d="M11 10.9219C9.38438 10.9219 8.07812 9.61562 8.07812 8C8.07812 6.38438 9.38438 5.07812 11 5.07812C12.6156 5.07812 13.9219 6.38438 13.9219 8C13.9219 9.61562 12.6156 10.9219 11 10.9219ZM11 6.625C10.2437 6.625 9.625 7.24375 9.625 8C9.625 8.75625 10.2437 9.375 11 9.375C11.7563 9.375 12.375 8.75625 12.375 8C12.375 7.24375 11.7563 6.625 11 6.625Z"
              fill=""
            />
          </svg>
        </CardDataStats>
        {/* Otros componentes de CardDataStats */}
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <ChartOne />
        <ChartTwo />
        <ChartLineaTemp />
        <div className="col-span-12 xl:col-span-8">
          <TableOne />
        </div>
        <ChatCard />
      </div>
    </>
  );
};

export default RMA;
