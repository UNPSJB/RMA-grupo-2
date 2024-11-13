import { ApexOptions } from 'apexcharts';
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import Select, { MultiValue, ActionMeta, SingleValue } from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';

interface Medicion {
  id: number;
  nodo: number;
  tipo: number; 
  dato: number;
  tiempo: Date;
  error: boolean;
}

/*const allProducts = [
  { name: 'Nodo 1', data: [] }, // Comenzamos con un array vacío
  { name: 'Nodo 2', data: [34, 22, 41, 27, 50, 19, 64, 53, 31, 48, 22, 40, 58, 33, 25, 46, 69, 37, 55, 44, 26, 60, 43, 28, 52] },
  { name: 'Nodo 3', data: [20, 15, 30, 22, 40, 25, 55, 50, 20, 30, 50, 40, 60, 25, 45, 35, 55, 65, 25, 35, 45, 55, 30, 60, 40] },
  { name: 'Nodo 4', data: [25, 20, 40, 18, 60, 22, 53, 47, 35, 25, 44, 55, 62, 20, 44, 38, 50, 64, 37, 50, 48, 64, 34, 56, 42] },
  { name: 'Nodo 5', data: [15, 25, 35, 45, 55, 20, 40, 60, 30, 50, 35, 45, 55, 60, 70, 20, 45, 55, 60, 65, 70, 25, 35, 45, 50] },
];*/



const ChartOne: React.FC = () => {
  const [filteredData, setFilteredData] = useState<Medicion[]>([]);
  const [medicionData, setMedicionData] = useState<Medicion[]>([]);
  const [fechas, setFechas] = useState<Date[]>([]);
  const [valores, setValores] = useState<number[]>([]);

  const options: ApexOptions = {
    legend: { show: true },
    chart: { type: 'area', height: 350 },
    xaxis: {
      categories: Array.from({ length: filteredData.length }, (_, i) => i.toString()), // Mantener las categorías fijas
      labels: { show: true },
      title: { text: 'Hora' },
    },
    yaxis: {
      labels: { show: true, formatter: (val) => Math.round(val).toString() },
      title: { text: 'Temperatura (ºC)' },
    },
    markers: { size: 5, colors: ['#3C50E0'] },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth', // Define la suavidad de la línea
      width: 2, // Ajusta el grosor de la línea
    },
  };


  /*useEffect(() => {
    const fetchNodo1Data = async () => {
      try {
        const response = await axios.get('http://localhost:8000/medicion/filtrar');
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
  ];*/

  const selectNodeOptions = [
    { value: 1, label: "Nodo 1" },
    { value: 2, label: "Nodo 2" },
    { value: 3, label: "Nodo 3" },
  ];
  const selectDataTypeOptions = [
    { value: 1, label: "Temperatura" },
    { value: 25, label: "Altura" },
  ];

  const [selectedNode, setSelectedNode] = useState(selectNodeOptions[0].value);
  const [selectedDataType, setSelectedDataType] = useState(selectDataTypeOptions[0].value);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const handleNodeSelect = (selectedOption: SingleValue<{ value: number; label: string }>) => {
    if(selectedOption != null){
      setSelectedNode(selectedOption.value);
    }
  };

  const handleDataTypeSelect = (selectedOption: SingleValue<{ value: number; label: string }>) => {
    if(selectedOption != null){
      setSelectedDataType(selectedOption.value);
    }
  };

  const handleSearch = async () => {

    try {
      const response = await axios.get('http://localhost:8000/medicion/');
      let data = response.data;
      console.log({data});
      setMedicionData(data)
      if (selectedNode !== null) {
        data = data.filter((item: { nodo: number; }) => item.nodo === Number(selectedNode));
      }
  
      if (selectedDataType === 1) {
        data = data.filter((item: { tipo: number; }) => item.tipo === 1 || item.tipo === 2);
      } else if (selectedDataType === 25) {
        data = data.filter((item: { tipo: number; }) => item.tipo === 25);
      }
  
      if (startDate) {
        data = data.filter((item: { tiempo: string | number | Date; }) => new Date(item.tiempo) >= new Date(startDate));
      }
  
      if (endDate) {
        data = data.filter((item: { tiempo: string | number | Date; }) => new Date(item.tiempo) <= new Date(endDate));
      }
      //data.sort(function(a: Medicion, b:Medicion){ return( (a.tiempo).getTime() - (b.tiempo).getTime())});
      setFilteredData(data);
      setFechas(filteredData.map((d: Medicion) => d.tiempo));
      setValores(filteredData.map((d: Medicion) => d.dato));
      console.log({filteredData});
      console.log({fechas});
      console.log({valores});
    } catch (error) {
      console.error('Error al obtener las mediciones:', error);
    }
    

  }
  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex justify-between items-center mb-5">
        {/* Selector de Nodo */}
        <Select
          options={selectNodeOptions}
          onChange={handleNodeSelect}
          className="w-full max-w-xs"
          defaultValue={selectNodeOptions[0]} // Valor por defecto Nodo 1
        />

        {/* Selector de Tipo de Dato */}
        <Select
          options={selectDataTypeOptions}
          onChange={handleDataTypeSelect}
          className="w-full max-w-xs"
          defaultValue={selectDataTypeOptions[0]} // Valor por defecto, por ejemplo Temperatura
        />

        {/* Selector de Rango de Fechas */}
        <div className="flex space-x-2">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Fecha Desde"
            className="w-full max-w-xs"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="Fecha Hasta"
            className="w-full max-w-xs"
          />
          <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Buscar
        </button>
        </div>
      </div>

      {/* Gráfico */}
      <ReactApexChart
        options={{
          ...options,
          xaxis: { type: 'datetime', categories: fechas }, // Ajusta con las fechas
        }}
        series={[{
          name: selectDataTypeOptions[selectedDataType].label,
          data: valores // Ajusta con los valores de las mediciones filtradas
        }]}
        type="area"
        height={350}
      />
    </div>
  );
};


export default ChartOne;
