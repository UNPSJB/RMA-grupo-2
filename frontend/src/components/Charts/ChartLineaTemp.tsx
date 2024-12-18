import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import selectStyles from 'styles'
const options: ApexOptions = {
  legend: {
    show: false,
    position: 'top',
    horizontalAlign: 'left',
  },
  colors: ['#3C50E0', '#80CAEE'],
  chart: {
    fontFamily: 'Satoshi, sans-serif',
    height: 335,
    type: 'area',
    dropShadow: {
      enabled: true,
      color: '#623CEA14',
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1,
    },
    toolbar: {
      show: false,
    },
  },
  responsive: [
    {
      breakpoint: 1024,
      options: {
        chart: {
          height: 300,
        },
      },
    },
    {
      breakpoint: 1366,
      options: {
        chart: {
          height: 350,
        },
      },
    },
  ],
  stroke: {
    width: [2, 2],
    curve: 'smooth',
  },
  grid: {
    xaxis: {
      lines: {
        show: true,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 4,
    colors: '#fff',
    strokeColors: ['#3056D3', '#80CAEE'],
    strokeWidth: 3,
    strokeOpacity: 0.9,
    strokeDashArray: 0,
    fillOpacity: 1,
    hover: {
      size: undefined,
      sizeOffset: 5,
    },
  },
  xaxis: {
    type: 'category',
    categories: [], // Se actualizará dinámicamente
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    title: {
      style: {
        fontSize: '0px',
      },
    },
    min: 0,
    max: 100,
  },
};

interface ChartOneState {
  series: {
    name: string;
    data: number[];
  }[];
}
const ChartLineaTemp: React.FC = () => {
  const [state, setState] = useState<ChartOneState>({
    series: [
      {
        name: 'Temperatura',
        data: [], // Inicialmente vacío
      },
    ],
  });
  
  
  const [categories, setCategories] = useState<string[]>([]); // Para las etiquetas del eje X
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    //fetchTemperatureData(timeFrame);
  }, [timeFrame]);

  /*
const fetchTemperatureData = async (timeFrame: 'day' | 'week' | 'month') => {
  try {
    const response = await fetch(`/api/temperatures?timeFrame=${timeFrame}`);
    const result = await response.json();
    
    const labels = result.map((item: any) => item.label); // Cada item tiene un campo 'label'
    const values = result.map((item: any) => item.value); // Cada item tiene un campo 'value'
    
    setCategories(labels);
    setState({
      series: [
        {
          name: 'Temperatura',
          data: values,
        },
      ],
      } catch (error) {
        console.error('Error fetching temperature data:', error);
  }
});

};
*/

const handleTimeFrameChange = (frame: 'day' | 'week' | 'month') => {
  setTimeFrame(frame);
  };

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          {/* Gráfico de Temperatura */}
          <div className="flex min-w-47.5">
            <span className="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-primary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-primary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-primary">Temperatura</p>
              <p className="text-sm font-medium">{timeFrame === 'day' ? 'Hoy' : timeFrame === 'week' ? 'Últimas 4 semanas' : 'Últimos 12 meses'}</p>
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-45 justify-end">
          <div className="inline-flex items-center rounded-md bg-whiter p-1.5 dark:bg-meta-4">
            <button onClick={() => handleTimeFrameChange('day')} className="rounded py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark">
              Dia
            </button>
            <button onClick={() => handleTimeFrameChange('week')} className="rounded py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark">
              Mes
            </button>
            <button onClick={() => handleTimeFrameChange('month')} className="rounded py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark">
              Año
            </button>
          </div>
        </div>
      </div>

      <div>
        <div id="chartOne" className="-ml-5">
          <ReactApexChart
            options={{ ...options, xaxis: { ...options.xaxis, categories } }} // Actualiza las categorías del eje X
            series={state.series}
            type="area"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartLineaTemp;