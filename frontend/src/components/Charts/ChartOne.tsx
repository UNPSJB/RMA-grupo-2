import { ApexOptions } from 'apexcharts';
import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import Select from 'react-select';

// Productos de ejemplo
const allProducts = [
  { name: 'Nodo 1', data: [23, 17, 35, 12, 46, 28, 32, 47, 18, 29, 55, 33, 44, 21, 37, 42, 59, 26, 30, 53, 19, 61, 24, 48, 39] },
  { name: 'Nodo 2', data: [34, 22, 41, 27, 50, 19, 64, 53, 31, 48, 22, 40, 58, 33, 25, 46, 69, 37, 55, 44, 26, 60, 43, 28, 52] },
  { name: 'Nodo 3', data: [20, 15, 30, 22, 40, 25, 55, 50, 20, 30, 50, 40, 60, 25, 45, 35, 55, 65, 25, 35, 45, 55, 30, 60, 40] },
  { name: 'Nodo 4', data: [25, 20, 40, 18, 60, 22, 53, 47, 35, 25, 44, 55, 62, 20, 44, 38, 50, 64, 37, 50, 48, 64, 34, 56, 42] },
  { name: 'Nodo 5', data: [15, 25, 35, 45, 55, 20, 40, 60, 30, 50, 35, 45, 55, 60, 70, 20, 45, 55, 60, 65, 70, 25, 35, 45, 50] },
];

// Opciones del gráfico
const options: ApexOptions = {
  legend: {
    show: false,
    position: 'top',
    horizontalAlign: 'left',
  },
  chart: {
    type: 'area',
    height: 350,
  },
  xaxis: {
    categories: Array.from({ length: 25 }, (_, i) => i.toString()), // Genera ['0', '1', ..., '24']
    labels: {
      show: true, // Muestra las etiquetas del eje x
    },
    title: {
      text: 'Hora', // Título del eje X
    },
  },
  yaxis: {
    labels: {
      show: true, // Muestra las etiquetas del eje y
    },
    title: {
      text: 'Temperatura (ºC)', // Título del eje Y
    },
  },
  markers: {
    size: 5, // Tamaño de los puntos
    colors: ['#3C50E0'], // Color de los puntos
  },
  dataLabels: {
    enabled: false, // Desactiva las etiquetas de los datos en el gráfico
  },
};

// Opciones para `react-select`
const productOptions = allProducts.map((product, index) => ({
  value: index,
  label: product.name,
}));

const ChartOne: React.FC = () => {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([0, 1]); // Por defecto, Nodo 1 y Nodo 2

  // Manejar la selección del dropdown
  const handleProductSelect = (selectedOptions: any) => {
    const selectedValues = selectedOptions.map((option: any) => option.value);
    setSelectedProducts(selectedValues);
  };

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex justify-between items-center mb-5">
        {/* Dropdown estilizado con react-select */}
        <Select
          isMulti
          options={productOptions}
          onChange={handleProductSelect}
          className="w-full max-w-xs"
          defaultValue={productOptions.slice(0, 2)} // Por defecto seleccionados Nodo 1 y Nodo 2
        />
      </div>

      <div>
        <ReactApexChart
          options={options}
          series={selectedProducts.map((index) => ({
            name: allProducts[index].name,
            data: allProducts[index].data,
          }))}
          type="area"
          height={350}
        />
      </div>
    </div>
  );
};

export default ChartOne;
