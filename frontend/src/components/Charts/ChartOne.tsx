import { ApexOptions } from 'apexcharts';
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import Select, { MultiValue, ActionMeta } from 'react-select';
import axios from 'axios';

const allProducts = [
  { name: 'Nodo 1', data: [] }, // Comenzamos con un array vacío
  { name: 'Nodo 2', data: [34, 22, 41, 27, 50, 19, 64, 53, 31, 48, 22, 40, 58, 33, 25, 46, 69, 37, 55, 44, 26, 60, 43, 28, 52] },
  { name: 'Nodo 3', data: [20, 15, 30, 22, 40, 25, 55, 50, 20, 30, 50, 40, 60, 25, 45, 35, 55, 65, 25, 35, 45, 55, 30, 60, 40] },
  { name: 'Nodo 4', data: [25, 20, 40, 18, 60, 22, 53, 47, 35, 25, 44, 55, 62, 20, 44, 38, 50, 64, 37, 50, 48, 64, 34, 56, 42] },
  { name: 'Nodo 5', data: [15, 25, 35, 45, 55, 20, 40, 60, 30, 50, 35, 45, 55, 60, 70, 20, 45, 55, 60, 65, 70, 25, 35, 45, 50] },
];

const options: ApexOptions = {
  legend: { show: true },
  chart: { type: 'area', height: 350 },
  xaxis: {
    categories: Array.from({ length: 25 }, (_, i) => i.toString()), // Mantener las categorías fijas
    labels: { show: true },
    title: { text: 'Hora' },
  },
  yaxis: {
    labels: { show: true, formatter: (val) => Math.round(val).toString() },
    title: { text: 'Temperatura (ºC)' },
  },
  markers: { size: 5, colors: ['#3C50E0'] },
  dataLabels: { enabled: false },
};

interface OptionType {
  value: number;
  label: string;
}

const ChartOne: React.FC = () => {
  const [nodo1Data, setNodo1Data] = useState<number[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([0, 1]);

  useEffect(() => {
    const fetchNodo1Data = async () => {
      try {
        const response = await axios.get('http://localhost:8000/mediciones/');
        const data = response.data;

        // Agrupar y calcular el promedio de temperaturas por hora
        const groupedData: { [key: string]: number[] } = {};
        data.forEach((item: any) => {
          const date = new Date(item.tiempo).getHours(); // Obtener solo la hora
          if (!groupedData[date]) {
            groupedData[date] = [];
          }
          groupedData[date].push(parseFloat(item.dato)); // Convertir a número
        });

        // Calcular promedios por hora (de 0 a 23)
        const averageData = Array.from({ length: 24 }, (_, i) => {
          const values = groupedData[i] || [];
          return values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0; // Promedio o 0 si no hay datos
        });

        setNodo1Data(averageData); // Actualizamos el estado con los promedios
      } catch (error) {
        console.error('Error al obtener datos del Nodo 1:', error);
      }
    };

    fetchNodo1Data();
  }, []);

  // Combinamos los datos del nodo 1 con los datos falsos de otros nodos
  const series = [
    { name: 'Nodo 1', data: nodo1Data.length > 0 ? nodo1Data : Array(24).fill(0) }, // Datos promediados del nodo 1
    { name: 'Nodo 2', data: allProducts[1].data }, // Datos falsos
    { name: 'Nodo 3', data: allProducts[2].data }, // Datos falsos
    { name: 'Nodo 4', data: allProducts[3].data }, // Datos falsos
    { name: 'Nodo 5', data: allProducts[4].data }, // Datos falsos
  ];

  // Manejar la selección del dropdown
  const handleProductSelect = (selectedOptions: MultiValue<OptionType>, actionMeta: ActionMeta<OptionType>) => {
    const selectedValues = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    setSelectedProducts(selectedValues);
  };

  const selectOptions: OptionType[] = series.map((product, index) => ({
    value: index,
    label: product.name,
  }));

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex justify-between items-center mb-5">
        <Select
          isMulti
          options={selectOptions}
          onChange={handleProductSelect}
          className="w-full max-w-xs"
          defaultValue={selectOptions.slice(0, 2)} // Por defecto seleccionados Nodo 1 y Nodo 2
        />
      </div>

      <ReactApexChart
        options={options}
        series={selectedProducts.map((index) => series[index])}
        type="area"
        height={350}
      />
    </div>
  );
};

export default ChartOne;
