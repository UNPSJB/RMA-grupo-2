import { ApexOptions } from 'apexcharts';
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import Select, { SingleValue } from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';

interface Medicion {
  id: number;
  nodo: number;
  tipo: number;
  dato: number;
  tiempo: string; // Usar string para trabajar directamente con las fechas del backend
  error: boolean;
}

const ChartOne: React.FC = () => {
  const [medicionData, setMedicionData] = useState<Medicion[]>([]);
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

  const options: ApexOptions = {
    legend: { show: true },
    chart: { type: 'area', height: 350 },
    xaxis: {
      type: 'datetime',
      labels: { show: true },
      title: { text: 'Hora' },
    },
    yaxis: {
      labels: { formatter: (val) => Math.round(val).toString() },
      title: { text: 'Temperatura (ºC)' },
    },
    markers: { size: 5, colors: ['#3C50E0'] },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
  };

  const fetchNodos = async () => {
    try {
      const response = await axios.get("http://localhost:8000/lista_nodos/");
      setSelectNodeOptions(response.data); // Establecer el listado dinámicamente
    } catch (error) {
      console.error("Error al obtener los nodos:", error);
    }
  };

  const fetchDataType = async () => {
    try {
      const response = await axios.get("http://localhost:8000/lista_tipo_medicion/");
      setSelectDataTypeOptions(response.data); // Establecer el listado dinámicamente
    } catch (error) {
      console.error("Error al obtener los tipo de medicion:", error);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get('http://localhost:8000/medicion/');
      let data = response.data as Medicion[];

      if (selectedNode) {
        data = data.filter((item) => item.nodo === selectedNode);
      }

      if (selectedDataType === 1) {
        data = data.filter((item) => item.tipo === 1 || item.tipo === 2);
      } else if (selectedDataType === 25) {
        data = data.filter((item) => item.tipo === 25);
      }

      if (startDate) {
        data = data.filter((item) => new Date(item.tiempo) >= startDate);
      }

      if (endDate) {
        data = data.filter((item) => new Date(item.tiempo) <= endDate);
      }

      setFilteredData(data);
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
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default">
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
            className="w-full max-w-xs"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date || new Date())}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
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
