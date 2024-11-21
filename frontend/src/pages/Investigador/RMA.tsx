import React, { useEffect, useState } from 'react';
import { usePDF } from 'react-to-pdf';
import CardDataStats from '../../components/CardDataStats';
import ChartOne from '../../components/Charts/ChartOne';
import ChartTwo from '../../components/Charts/ChartTwo';
import TableOne from '../../components/Tables/TableOne';
import ChartLineaTemp from '../../components/Charts/ChartLineaTemp';
import ChubutMap from '../../components/Maps/ChubutMap';
import axios from 'axios';
import Buttons from '../UiElements/Buttons';


enum TipoMensaje {
  TEMP_T = 1,  
  TEMP2_T = 2, 
  HUMIDITY_T = 3,
  PRESSURE_T = 4,
  LIGHT_T = 5, 
  SOIL_T = 6,  
  SOIL2_T = 7, 
  SOILR_T = 8, 
  SOILR2_T = 9,  
  OXYGEN_T = 10,  
  CO2_T = 11,
  WINDSPD_T = 12, 
  RAINFALL_T = 13,
  WINDHDG_T = 14,
  MOTION_T = 15,
  VOLTAGE_T = 16, 
  VOLTAGE2_T = 17, 
  CURRENT_T = 18,
  CURRENT2_T = 19, 
  IT_T = 20,
  LATITUDE_T = 21,
  LONGITUDE_T = 22,
  ALTITUDE_T = 23,
  HDOP_T = 24,
  WATER_HEIGHT = 25,
}

const RMA: React.FC = () => {
//  const [isLoading, setIsLoading] = useState(true);
  const [lastMeasurement, setLastMeasurement] = useState<
  { temperature: { value: number | null; nodo: number | null }; height: { value: number | null; nodo: number | null } }>({
    temperature: { value: null, nodo: null },
    height: { value: null, nodo: null },
  });
  const [error, setError] = useState<string | null>(null);
  const { toPDF, targetRef } = usePDF({filename: 'rma-dashboard-reporte.pdf'});
 
 
  const getLastMeasurement = async (type: int) => {
    try {
      const response = await axios.get(`http://localhost:8000/mediciones/${type}`);
      const lastData = response.data;
      if (!lastData) return null;
      return {value: Math.round(lastData.dato * 100) / 100, nodo: lastData.nodo };
            
    } catch (error) {
      console.error('Error al obtener la última medición:', error);
      setError('Error al cargar la última medición.');
      return null;
    }
  };
  const fetchLastMeasurement = async () => {
    //setIsLoading(true);
    try {
      const [lastTemp, lastHeight] = await Promise.all([
        getLastMeasurement(TipoMensaje.TEMP_T),
        getLastMeasurement(TipoMensaje.VOLTAGE_T),
      ]);

      setLastMeasurement((prev) => {
        const isTemperatureChanged = prev.temperature.value !== lastTemp?.value;
        const isHeightChanged = prev.height.value !== lastHeight?.value;
  
        if (isTemperatureChanged || isHeightChanged) {
          return { temperature: lastTemp, height: lastHeight };
        }
  
        return prev; // No actualiza si no hay cambios
      });
      
  } catch (error) {
    console.error('Error en al obtener las ultimas temperaturas:', error);
    setError('Error al cargar los datos.');
  } //finally {
  //   setIsLoading(false);
  // }
  };

  useEffect(() => {
    
    fetchLastMeasurement();
    const intervalId = setInterval(fetchLastMeasurement, 60000  
    );

    return () => clearInterval(intervalId);
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <button onClick={() => toPDF()} className="mb-4 px-4 py-2 text-sm text-white bg-blue-500 rounded">
        Descargar Reporte PDF
      </button>

      <div ref={targetRef}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <CardDataStats 
            title={`Última temperatura registrada (Nodo ${lastMeasurement.temperature.nodo || 'N/A'})`} 
            total={lastMeasurement.temperature.value !== null ? `${lastMeasurement.temperature.value}°C` : 'Cargando...'} 
            rate= '' 
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
            title={`Última altura registrada (Nodo ${lastMeasurement.height.nodo || 'N/A'})`} 
            total={lastMeasurement.height.value !== null ? `${lastMeasurement.height.value} mm` : 'Cargando...'} 
            rate="" 
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
      </div>
    </>
  );
};

export default RMA;