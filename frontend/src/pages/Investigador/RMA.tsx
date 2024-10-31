import React, { useEffect, useState } from 'react';
import CardDataStats from '../../components/CardDataStats';
import ChartOne from '../../components/Charts/ChartOne';
import ChartTwo from '../../components/Charts/ChartTwo';
//import ChatCard from '../../components/Chat/ChatCard';
import TableOne from '../../components/Tables/TableOne';
import ChartLineaTemp from '../../components/Charts/ChartLineaTemp';
import ChubutMap from '../../components/Maps/ChubutMap';


enum TipoMensaje {
  //STATUS: ''
  TEMP_T = 'temperature',  
  TEMP2_T = 'temperatureTwo', 
  HUMIDITY_T = 'RelativeHumidity',
  PRESSURE_T = 'AtmospherucPressure',
  LIGHT_T = 'Light', 
  SOIL_T = 'soilMoisture',  
  SOIL2_T = 'soilMoistureTwo', 
  SOILR_T = 'soilResistance', 
  SOILR2_T = 'soilResistanceTwo',  
  OXYGEN_T = 'oxygen',  
  CO2_T = 'carbonDioxide',
  WINDSPD_T = 'windSpeed', 
  RAINFALL_T = 'rainFall',
  WINDHDG_T = 'windDirection',
  MOTION_T = 'motion',
  VOLTAGE_T = 'voltageBaterry', 
  VOLTAGE2_T = 'voltageTwo', 
  CURRENT_T = 'current' ,
  CURRENT2_T = 'currentTwo', 
  IT_T = 'iterations' ,
  LATITUDE_T = 'gpsLatitude',
  LONGITUDE_T = 'gpsLongitude',
  ALTITUDE_T = 'gpsAltitude' ,
  HDOP_T = 'gpsHDOP',
  WATER_HEIGHT = 'heightWater', 
}

const RMA: React.FC = () => {
  const [LastMeasurin, setLastMeasuring] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  //const [LastHeight, setLastHeight] = useState<number | null>(null);

  const getLastMeasurin = async (tipo: TipoMensaje) => {
    try {
      const response = await fetch('http://localhost:8000/medicion/');
      
      const data = await response.json();
      if (data.length === 0) return null;

      const filter = data.filter((item: { type:string } ) => item.type = tipo);
      if (filter.length === 0) return null;

      const lastMeasurin = filter.reduce((prev: { tiempo: string | number | Date; }, current: { tiempo: string | number | Date; }) => 
        new Date(prev.tiempo) > new Date(current.tiempo) ? prev : current
      );

      return Math.round(lastMeasurin.dato * 100) / 100; // Retorna el valor de "dato"
    } catch (error) {
      console.error('Error al obtener la última medicion:', error);
      setError('Error al cargar la última medicion.');
      return null;
    }
  };

  useEffect(() => {
    const fetchLastMeasurin = async () => {
      console.log(TipoMensaje.TEMP_T);
      const lastTemp = await getLastMeasurin(TipoMensaje.TEMP_T);
      setLastMeasuring(lastTemp);
    };

    fetchLastMeasurin(); // Inicializa la primera carga
    const intervalId = setInterval(fetchLastMeasurin, 60000); // Actualiza cada minuto (60000 ms)

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
          total={LastMeasurin !== null ? `${LastMeasurin}°C` : 'Cargando...'} 
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
  
        <CardDataStats
          title="Última Altura Registrada" 
          total={LastMeasurin !== null ? `${(Math.random() * 10).toFixed(4)}` : 'Cargando...'} 
          rate="0" 
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
      </div>
  
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <ChartOne />
        <ChartTwo />
        <ChartLineaTemp />
        <div className="col-span-12 xl:col-span-8">
          <TableOne />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12">
          <h1 className="text-xl font-bold mb-4">Mapa de Nodos en Chubut</h1>
        </div>
        <div className="col-span-12 md:col-span-8 lg:col-span-6 xl:col-span-5">
          <ChubutMap />
        </div>
      </div>
    </>
  );
};
export default RMA;
