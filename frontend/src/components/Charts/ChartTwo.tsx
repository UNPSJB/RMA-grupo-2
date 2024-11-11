import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';

const options: ApexOptions = {
  colors: ['#3C50E0'],
  chart: {
    fontFamily: 'Satoshi, sans-serif',
    type: 'bar',
    height: 335,
    stacked: true,
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
  },
  responsive: [
    {
      breakpoint: 1536,
      options: {
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: '25%',
          },
        },
      },
    },
  ],
  plotOptions: {
    bar: {
      horizontal: false,
      borderRadius: 4,
      columnWidth: '25%',
    },
  },
  dataLabels: {
    enabled: false,
  },
  xaxis: {
    categories: ['L', 'M', 'M', 'J', 'V', 'S', 'D'], // Días de la semana en el eje X
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
    fontFamily: 'Satoshi',
    fontWeight: 500,
    fontSize: '14px',
  },
  fill: {
    opacity: 1,
  },
};

interface Medicion {
  nodo: number;
  tipo: number;
  dato: number;
  tiempo: string;
  error: boolean;
}

interface ChartTwoState {
  series: {
    name: string;
    data: number[];
  }[];
}

const ChartTwo: React.FC = () => {
  const [state, setState] = useState<ChartTwoState>({
    series: [
      {
        name: 'Altura',
        data: [], // Datos de altura en metros para la semana
      },
    ],
  });

  useEffect(() => {
    const obtenerDatosAltura = async () => {
      try {
        const response = await axios.get<Medicion[]>('http://localhost:8000/medicion/');
        
        // Filtrar las mediciones de tipo "Altura" (tipo === 25) y agrupar por día de la semana
        const datosAltura = response.data
          .filter((medicion) => medicion.tipo === 25)
          .reduce((acc, medicion) => {
            const fecha = new Date(medicion.tiempo);
            const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

            // Guardamos una medición por día de la semana, usando el último valor si hay varios
            acc[diaSemana] = medicion.dato;
            return acc;
          }, Array(7).fill(null) as (number | null)[]); // Array de 7 elementos para cada día de la semana

        // Ajustamos datos para la semana (Lunes a Domingo)
        const alturaSemana = [1, 2, 3, 4, 5, 6, 0].map((day) => datosAltura[day] || 0);

        // Actualizamos el estado del gráfico
        setState({
          series: [{ name: 'Altura', data: alturaSemana }],
        });
      } catch (error) {
        console.error('Error al obtener las mediciones:', error);
      }
    };

    obtenerDatosAltura();
  }, []);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Gráfico de Altura Semanal
          </h4>
        </div>
      </div>
      <div>
        <div id="chartTwo" className="-ml-5 -mb-9">
          <ReactApexChart
            options={options}
            series={state.series}
            type="bar"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartTwo;
