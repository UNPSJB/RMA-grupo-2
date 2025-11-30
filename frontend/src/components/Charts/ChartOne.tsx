import { ApexOptions } from 'apexcharts';
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';

//import selectStyles from './styles';

interface ChartOneProps {
  nodo?: number | '';
  nodoLabel?: string | null;
}

interface Medicion {
  id: number;
  nodo: number;
  tipo: number;
  dato: number;
  tiempo: string; // Usar string para trabajar directamente con las fechas del backend
  error: boolean;
}

const ChartOne: React.FC<ChartOneProps> = ({ nodo, nodoLabel }) => {
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
    2: { min: -20, max: 60, title: "Temperatura (ºC)" },
    17: { min: 0, max: 100, title: "Voltaje(V)" },
    26: { min: 0, max: 200, title: "Altura del suelo (mm)" },
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
      // Seleccionar por defecto el tipo que contenga 'Temper' en la etiqueta, si existe
      try {
        const types = response.data as { value: number; label: string }[];
        const tempType = types.find(t => /temper/i.test(t.label));
        if (tempType) {
          setSelectedDataType(tempType.value);
        } else if (types.length > 0) {
          setSelectedDataType(types[0].value);
        }
      } catch (e) {
        // Silenciar errores de parsing
      }
    } catch (error) {
      console.error("Error al obtener los tipo de medicion:", error);
    }
  };

const handleSearch = async () => {
  try {
    const filtros = {
      nodo: nodo !== undefined && nodo !== '' ? nodo : selectedNode,
      tipo: selectedDataType,
      fechaDesde: startDate.toISOString(),
      fechaHasta: endDate.toISOString(),
    };

    const response = await axios.post(
      "http://localhost:8000/medicion/filtrar",
      filtros
    );

    const data = response.data as Medicion[];
    setFilteredData(data);

    const range = yAxisSettings[selectedDataType];
    setChartOptions((prevOptions) => ({
      ...prevOptions,
      yaxis: {
        ...prevOptions.yaxis,
        min: range?.min ?? 0,
        max: range?.max ?? 100,
        title: { text: range?.title ?? "Dato" },
      },
    }));

    if (!range) {
      console.warn("Tipo de medición no definido en yAxisSettings:", selectedDataType);
    }
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

  // Si cambia el nodo global, actualizar el nodo seleccionado
  useEffect(() => {
    if (nodo !== undefined && nodo !== '') {
      const nodoNum = Number(nodo);
      setSelectedNode(nodoNum);
      // Cargar automáticamente el último mes de temperatura para este nodo
      fetchLastMonthTemperature(nodoNum);
    }
  }, [nodo]);

  const fetchLastMonthTemperature = async (nodoSelected: number) => {
    try {
      // Forzar tipo TEMP_T (1)
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);

      const filtrosBase = {
        nodo: nodoSelected,
        fechaDesde: oneMonthAgo.toISOString(),
        fechaHasta: now.toISOString(),
      };

      // Intentar primero tipo TEMP_T (2) y luego TEMP2_T (3)
      let response = await axios.post("http://localhost:8000/medicion/filtrar", { ...filtrosBase, tipo: 2 });
      let data = response.data as Medicion[];

      // Si no hay datos para tipo 2, intentar tipo 3
      if (!data || data.length === 0) {
        response = await axios.post("http://localhost:8000/medicion/filtrar", { ...filtrosBase, tipo: 3 });
        data = response.data as Medicion[];
      }

      setFilteredData(data);

  // Actualizar opciones y eje Y para temperatura (tipo 2)
  const range = yAxisSettings[2];
      setChartOptions((prevOptions) => ({
        ...prevOptions,
        yaxis: {
          ...prevOptions.yaxis,
          min: range?.min ?? 0,
          max: range?.max ?? 100,
          title: { text: range?.title ?? "Dato" },
        },
      }));

      // Actualizar selectDataType y fechas locales para reflejar la carga automática
      // Actualizar selectedDataType según si obtuvimos datos para tipo 2 o tipo 3
      if (data && data.length > 0) {
        // No recibimos 'tipo' desde el endpoint filtrado, así que asumimos que si
        // la primera petición (tipo 2) devolvió datos, usamos 2; si no, usamos 3.
        // Para simplificar, si la longitud de los datos no es cero y la segunda
        // petición fue la que devolvió, data proviene de la última petición.
        // Aquí comprobamos si hubo datos en la primera petición chequeando response.config.data
        try {
          const lastRequest = response?.config?.data || '';
          const parsed = JSON.parse(lastRequest || '{}');
          const requestedTipo = parsed.tipo;
          setSelectedDataType(requestedTipo ?? 2);
        } catch (e) {
          setSelectedDataType(2);
        }
      } else {
        // No data: dejar en 2 por defecto
        setSelectedDataType(2);
      }
      setStartDate(oneMonthAgo);
      setEndDate(now);
    } catch (error) {
      console.error('Error al cargar último mes de temperatura para nodo', nodoSelected, error);
    }
  };

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white dark:bg-boxdark px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark">
      <div className="flex justify-between items-center mb-5">
        <div className="mr-4">
          {(() => {
            const labelFromProp = nodo !== undefined && nodo !== '' ? (typeof nodoLabel !== 'undefined' ? nodoLabel : null) : null;
            const label = labelFromProp ?? (selectNodeOptions.find(opt => opt.value === selectedNode)?.label) ?? (nodo ? `Nodo ${nodo}` : `Nodo ${selectedNode}`);
            return <div className="text-sm font-medium text-black dark:text-white">Nodo: {label}</div>;
          })()}
        </div>
        {/* Si no hay nodo global, mostrar el selector local */}
        {nodo === undefined || nodo === '' ? (
          <Select
            options={selectNodeOptions}
            value={selectNodeOptions.find(opt => opt.value === selectedNode) || null}
            onChange={(option) => setSelectedNode(option ? option.value : 1)}
            placeholder="Seleccionar nodo"
            className="w-full max-w-xs"
          />
        ) : null}

        <Select
          options={selectDataTypeOptions}
          value={selectDataTypeOptions.find(opt => opt.value === selectedDataType) || null}
          onChange={(option) => {
            if (option && typeof option === 'object' && 'value' in option) {
              setSelectedDataType(option.value);
            }
          }}
          placeholder="Seleccionar tipo"
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