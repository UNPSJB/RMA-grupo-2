import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Medicion {
  nodo: number;
  tipo: number;
  dato: number;
  tiempo: string;
  error: boolean;
}

const TableTwo: React.FC = () => {
  const [medicionData, setMedicionData] = useState<Medicion[]>([]);
  const [filteredData, setFilteredData] = useState<Medicion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Estados para filtros
  const [nodoFilter, setNodoFilter] = useState<number | ''>('');
  const [tipoFilter, setTipoFilter] = useState<string>('Temperatura'); // Por defecto "Temperatura"
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [uniqueNodos, setUniqueNodos] = useState<number[]>([]); // Para el desplegable de nodos

  const [sortConfig, setSortConfig] = useState<{ key: keyof Medicion; direction: 'asc' | 'desc' }>({
    key: 'tiempo',
    direction: 'desc',
  });

  useEffect(() => {
    const obtenerMediciones = async () => {
      try {
        const response = await axios.get('http://localhost:8000/medicion/');
        const dataWithErrorFalse = response.data.filter((item: Medicion) => !item.error);
        setMedicionData(dataWithErrorFalse);
        setFilteredData(dataWithErrorFalse);

        // Extraer nodos únicos para el desplegable
        const nodosUnicos = Array.from(new Set(response.data.map((item: Medicion) => item.nodo))).sort((a, b) => a - b);
        setUniqueNodos(nodosUnicos);
      } catch (error) {
        console.error('Error al obtener las mediciones:', error);
        setError('Error al cargar los datos.');
      }
    };

    obtenerMediciones();
  }, []);

  useEffect(() => {
    let data = medicionData;

    if (nodoFilter !== '') {
      data = data.filter(item => item.nodo === Number(nodoFilter));
    }

    if (tipoFilter === 'Temperatura') {
      data = data.filter(item => item.tipo === 1 || item.tipo === 2);
    } else if (tipoFilter === 'Altura') {
      data = data.filter(item => item.tipo === 25);
    } else if (tipoFilter === 'Voltaje') {
      data = data.filter(item => item.tipo === 16);
    }

    if (fechaInicio) {
      data = data.filter(item => new Date(item.tiempo) >= new Date(fechaInicio));
    }

    if (fechaFin) {
      data = data.filter(item => new Date(item.tiempo) <= new Date(fechaFin));
    }

    setFilteredData(data);
    setCurrentPage(1);
  }, [nodoFilter, tipoFilter, fechaInicio, fechaFin, medicionData]);

  const handleSort = (key: keyof Medicion) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const downloadCSV = () => {
    const headers = ['Nodo', 'Tipo de Medición', 'Dato (con unidad)', 'Fecha y Hora'];

    const rows = filteredData.map(item => [
      item.nodo,
      item.tipo === 1 || item.tipo === 2
        ? 'Temperatura'
        : item.tipo === 25
        ? 'Altura'
        : item.tipo === 16
        ? 'Voltaje'
        : 'Otro',
      `${Math.round(item.dato * 100) / 100}${
        item.tipo === 1 || item.tipo === 2 ? ' °C' : item.tipo === 25 ? ' m' : item.tipo === 16 ? ' V' : ''
      }`,
      new Date(item.tiempo).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(value => `"${value}"`).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mediciones.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return <div className="text-red-500 font-bold">{error}</div>;
  }

  if (medicionData.length === 0) {
    return <div className="text-center">Cargando...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Historial de Mediciones</h4>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black dark:text-white mb-1">Filtrar por Nodo:</label>
          <select
            value={nodoFilter}
            onChange={e => setNodoFilter(e.target.value ? Number(e.target.value) : '')}
            className="px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            {uniqueNodos.map(nodo => (
              <option key={nodo} value={nodo}>
                Nodo {nodo}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black dark:text-white mb-1">Filtrar por Tipo:</label>
          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value)}
            className="px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="Temperatura">Temperatura</option>
            <option value="Altura">Altura</option>
            <option value="Voltaje">Voltaje</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black dark:text-white mb-1">Fecha Inicio:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
            className="px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black dark:text-white mb-1">Fecha Fin:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
            className="px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <button
        onClick={downloadCSV}
        className="mb-4 px-4 py-2 text-sm text-white bg-green-500 rounded hover:bg-green-600"
      >
        Descargar CSV
      </button>

      {/* Tabla */}
      <div className="max-h-96 overflow-y-auto">
        <div className="flex flex-col">
          <div className="grid grid-cols-3 rounded-sm bg-gray-200 dark:bg-gray-700 sm:grid-cols-4">
            <div onClick={() => handleSort('nodo')} className="p-2.5 font-semibold cursor-pointer">
              Nodo
            </div>
            <div onClick={() => handleSort('tipo')} className="p-2.5 font-semibold cursor-pointer">
              Tipo
            </div>
            <div onClick={() => handleSort('dato')} className="p-2.5 font-semibold cursor-pointer">
              Dato
            </div>
            <div onClick={() => handleSort('tiempo')} className="p-2.5 font-semibold cursor-pointer">
              Fecha
            </div>
          </div>
          {paginatedData.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-3 items-center border-b border-gray-300 dark:border-gray-600 sm:grid-cols-4"
            >
              <div className="p-2.5">{item.nodo}</div>
              <div className="p-2.5">
                {item.tipo === 1 || item.tipo === 2
                  ? 'Temperatura'
                  : item.tipo === 25
                  ? 'Altura'
                  : item.tipo === 16
                  ? 'Voltaje'
                  : 'Otro'}
              </div>
              <div className="p-2.5">
                {Math.round(item.dato * 100) / 100}
                {item.tipo === 1 || item.tipo === 2
                  ? ' °C'
                  : item.tipo === 25
                  ? ' mm'
                  : item.tipo === 16
                  ? ' V'
                  : ''}
              </div>
              <div className="p-2.5">
                {new Date(item.tiempo).toLocaleString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded disabled:bg-blue-300"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-400">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded disabled:bg-blue-300"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default TableTwo;
