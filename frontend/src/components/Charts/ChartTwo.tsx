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
  yaxis: {
    labels: {
      formatter: function (val) {
        // Mostrar sin notación científica ni muchos decimales
        return Number(val).toFixed(2).replace(/\.00$/, '');
      },
    },
  },
  tooltip: {
    y: {
      formatter: function (val) {
        return `${Number(val).toFixed(2)}`;
      },
    },
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

interface ChartTwoProps {
  nodo?: number | '';
  nodoLabel?: string | null;
}

const ChartTwo: React.FC<ChartTwoProps> = ({ nodo, nodoLabel }) => {
  const [state, setState] = useState<ChartTwoState>({
    series: [
      {
        name: 'Altura',
        data: [], 
      },
    ],
  });

  const [nodos, setNodos] = useState<number[]>([]);
  const [nodoSeleccionado, setNodoSeleccionado] = useState<number | null>(null);

  useEffect(() => {
    const obtenerDatosAltura = async () => {
      try {
        const response = await axios.get<Medicion[]>('http://localhost:8000/mediciones');
        const nodosUnicos = Array.from(new Set(response.data.map((medicion) => medicion.nodo))).sort((a, b) => a - b);
        setNodos(nodosUnicos);
        // Si hay nodo global, usarlo, si no, usar el local
        const nodoActual = nodo !== undefined && nodo !== '' ? Number(nodo) : (nodoSeleccionado !== null ? nodoSeleccionado : nodosUnicos[0]);
        if (nodo === undefined || nodo === '') setNodoSeleccionado(nodoActual);

        // Filtrar por tipo correcto (26) y por nodo, ordenar por tiempo descendente
        const datosFiltrados = response.data
          .filter((medicion) => Number(medicion.tipo) === 26 && Number(medicion.nodo) === Number(nodoActual) && medicion.error === false)
          .sort((a, b) => new Date(b.tiempo).getTime() - new Date(a.tiempo).getTime());

        // Reducir para obtener la última medición de cada día (primer elemento después del sort descendente)
        const datosAltura = datosFiltrados.reduce((acc, medicion) => {
          const fecha = new Date(medicion.tiempo);
          const diaSemana = fecha.getDay();
          if (acc[diaSemana] == null) {
            const val = typeof medicion.dato === 'string' ? parseFloat(medicion.dato) : Number(medicion.dato);
            acc[diaSemana] = Number.isNaN(val) ? null : val;
          }
          return acc;
        }, Array(7).fill(null) as (number | null)[]);

        const alturaSemana = [1, 2, 3, 4, 5, 6, 0].map((day) => {
          const val = datosAltura[day];
          return val == null ? 0 : val;
        });
        setState({
          series: [{ name: 'Altura', data: alturaSemana }],
        });
      } catch (error) {
        console.error('Error al obtener las mediciones:', error);
      }
    };
    obtenerDatosAltura();
  }, [nodo, nodoSeleccionado]);

  // Si cambia el nodo global, actualizar el nodo seleccionado local
  useEffect(() => {
    if (nodo !== undefined && nodo !== '') {
      setNodoSeleccionado(Number(nodo));
    }
  }, [nodo]);

  const handleNodoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNodoSeleccionado(Number(event.target.value));
  };


  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white p-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="mb-4 justify-between gap-4 sm:flex">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Gráfico de Altura Semanal {nodo !== undefined && nodo !== '' && (
              <span className="text-base font-normal text-gray-600 dark:text-gray-300">- {nodoLabel ?? `Nodo ${nodo}`}</span>
            )}
          </h4>
        </div>
        {/* Si no hay nodo global, mostrar el selector local */}
        {(nodo === undefined || nodo === '') && (
          <div>
            <select
              className="border rounded p-2"
              value={nodoSeleccionado || ''}
              onChange={handleNodoChange}
            >
              {nodos.map((nodo) => (
                <option key={nodo} value={nodo}>
                  Nodo {nodo}
                </option>
              ))}
            </select>
          </div>
        )}
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
