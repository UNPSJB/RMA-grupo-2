import { ApexOptions } from 'apexcharts';
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import Select, { SingleValue } from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
//import selectStyles from './styles';

interface Medicion {
  id: number;
  nodo: number;
  tipo: number;
  dato: number;
  tiempo: string; // Usar string para trabajar directamente con las fechas del backend
  error: boolean;
}

const ChartOne: React.FC = () => {
  const [filteredData, setFilteredData] = useState<Medicion[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectNodeOptions, setSelectNodeOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [selectDataTypeOptions, setSelectDataTypeOptions] = useState<
    { value: number; label: string }[]
  >([]);

  const [selectedNode, setSelectedNode] = useState<number>(1);
  const [selectedDataType, setSelectedDataType] = useState<number>(1);
  const [options, setChartOptions] = useState<ApexOptions>({
    legend: { show: true },
    chart: { type: "area", height: 350 },
    xaxis: {
      type: "datetime",
      labels: { show: true },
      title: { text: "Hora" },
    },
    yaxis: {
      labels: { formatter: (val) => Math.round(val).toString() },
      title: { text: ""},
    },
    markers: { size: 0, colors: ["#3C50E0"] },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    grid: {
      borderColor: '#333', // Línea de la cuadrícula en modo oscuro
    },
    fill: {
      opacity: 1,
      colors: ["#3C50E0"], // Color de fondo del gráfico en modo oscuro
    },
    tooltip: {
      theme: 'dark', // Activar el tema oscuro en los tooltips
    },
  });

  const yAxisSettings: Record<number, { min: number; max: number; title: string }> = {
    1: { min: -20, max: 60, title: "Temperatura (ºC)" },
    16: { min: 0, max: 100, title: "Voltaje(V)" },
    25: { min: 0, max: 200, title: "Altura del suelo (mm)" },
  };

  const fetchNodos = async () => {
    try {
      const response = await axios.get("http://localhost:8000/lista_nodos");
      setSelectNodeOptions(response.data); // Establecer el listado dinámicamente
    } catch (error) {
      console.error("Error al obtener los nodos:", error);
    }
  };

  const fetchDataType = async () => {
    try {
      const response = await axios.get("http://localhost:8000/lista_tipo_medicion");
      setSelectDataTypeOptions(response.data); // Establecer el listado dinámicamente
    } catch (error) {
      console.error("Error al obtener los tipo de medicion:", error);
    }
  };

  const handleSearch = async () => {
    try {
      // Crear el cuerpo del filtro
      const filtros = {
        nodo: selectedNode,
        tipo: selectedDataType,
        fechaDesde: startDate.toISOString(), // Convertir las fechas a formato ISO
        fechaHasta: endDate.toISOString(),
      };
  
      // Realizar la solicitud POST
      const response = await axios.post(
        "http://localhost:8000/medicion/filtrar", // Cambia el endpoint según corresponda
        filtros
      );
  
      // Procesar los datos devueltos por el backend
      const data = response.data as Medicion[];
      data.sort((a, b) => new Date(a.tiempo).getTime() - new Date(b.tiempo).getTime()); // Orden ascendente
      setFilteredData(data);
      const range = yAxisSettings[selectedDataType];
      setChartOptions((prevOptions) => ({
        ...prevOptions,
        yaxis: {
          ...prevOptions.yaxis,
          min: range.min,
          max: range.max,
          title: { text: range.title },
        },
      }));
    } catch (error) {
      console.error('Error al obtener las mediciones:', error);
    }
  };

  // Extraer fechas y valores para el gráfico
  const fechas = filteredData.map((d) => d.tiempo);
  const valores = filteredData.map((d) => d.dato);
  
  useEffect(() => {
    fetchNodos();
    fetchDataType();
  }, []);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white dark:bg-boxdark px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark">
      <div className="flex justify-between items-center mb-5">
        <Select
          options={selectNodeOptions}
          onChange={(option) => option && setSelectedNode(option.value)}
          defaultValue={""}
          className="w-full max-w-xs"
        />

        <Select
          options={selectDataTypeOptions}
          onChange={(option) => option && setSelectedDataType(option.value)}
          defaultValue={""}
          className="w-full max-w-xs"
        />

        <div className="flex space-x-2">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date || new Date())}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="w-full max-w-xs dark:text-white dark:bg-meta-4"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date || new Date())}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            className="w-full max-w-xs dark:text-white dark:bg-meta-4"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-800 dark:hover:bg-blue-700"
          >
            Buscar
          </button>
        </div>
      </div>

      <ReactApexChart
        options={{
          ...options,
          xaxis: { ...options.xaxis, categories: fechas },
        }}
        series={[{ name: "Datos", data: valores }]}
        type="area"
        height={350}
      />
    </div>
  );
};

export default ChartOne;