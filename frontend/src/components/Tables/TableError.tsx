import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Medicion {
  id: number;
  nodo: number;
  tipo: number;
  dato: number;
  tiempo: string;
  error: boolean;
}

const TableError: React.FC = () => {
  const [medicionData, setMedicionData] = useState<Medicion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filteredData, setFilteredData] = useState<Medicion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Estados para filtros
  const [nodoFilter, setNodoFilter] = useState<number | ''>('');
  const [tipoFilter, setTipoFilter] = useState<string>('Temperatura'); // Por defecto "Temperatura"
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [uniqueNodos, setUniqueNodos] = useState<Array<number | { value?: number | string; label?: string; id?: number }>>([]); // Para el desplegable de nodos

  const [sortConfig, setSortConfig] = useState<{ key: keyof Medicion; direction: 'asc' | 'desc' }>({
    key: 'tiempo',
    direction: 'desc',
  });

  useEffect(() => {
    const obtenerMediciones = async () => {
      try {
        const response = await axios.get('http://localhost:8000/medicion/');
        const dataWithError = (response.data || []).filter((item: Medicion) => item.error === true);
        setMedicionData(dataWithError);
        setFilteredData(dataWithError);

        // Extraer nodos únicos para el desplegable
        const nodosUnicos = Array.from(new Set(dataWithError.map((item: Medicion) => item.nodo))).sort((a, b) => a - b);
        setUniqueNodos(nodosUnicos as any);
      } catch (error) {
        console.error('Error al obtener las mediciones:', error);
        setError('Error al cargar los datos.');
      } finally {
        setIsLoading(false);
      }
    };

    obtenerMediciones();
  }, []);

  useEffect(() => {
    let data = medicionData;

    if (nodoFilter !== '') {
      data = data.filter(item => Number(item.nodo) === Number(nodoFilter));
    }

    if (tipoFilter === 'Temperatura') {
      data = data.filter(item => Number(item.tipo) === 1 || Number(item.tipo) === 2);
    } else if (tipoFilter === 'Altura') {
      data = data.filter(item => Number(item.tipo) === 26);
    } else if (tipoFilter === 'Otro') {
      data = data.filter(item => Number(item.tipo) !== 1 && Number(item.tipo) !== 2 && Number(item.tipo) !== 26);
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
    const headers = [
      'Nodo', 
      'Tipo de Medición', 
      'Dato (con unidad)', 
      'Fecha y Hora'
    ];

    const rows = filteredData.map(item => [
      item.nodo,
      Number(item.tipo) === 1 || Number(item.tipo) === 2 ? 'Temperatura' : Number(item.tipo) === 26 ? 'Altura' : 'Otro',
      `${Math.round(item.dato * 100) / 100}${Number(item.tipo) === 1 || Number(item.tipo) === 2 ? ' °C' : Number(item.tipo) === 26 ? ' m' : ''}`,
      new Date(item.tiempo).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    ]);
  
    const csvContent = [headers, ...rows]
      .map(row => row.map(value => `"${value}"`).join(';'))
      .join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'errores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return <div className="text-red-500 font-bold">{error}</div>;
  }

  if (isLoading) {
    return <div className="text-center">Cargando...</div>;
  }

  if (!isLoading && medicionData.length === 0) {
    return <div className="text-center">No se encontraron mediciones con error.</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Historial de Mediciones con Error
      </h4>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black dark:text-white mb-1">
            Filtrar por Nodo:
          </label>
          <select
            value={nodoFilter}
            onChange={(e) => setNodoFilter(e.target.value ? Number(e.target.value) : '')}
            className="px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            {(Array.isArray(uniqueNodos) ? uniqueNodos : []).map((nodo) => {
              // Aceptar tanto números como objetos { value, label }
              const value = typeof nodo === 'object' && nodo !== null ? (nodo.value ?? nodo.id ?? JSON.stringify(nodo)) : nodo;
              const label = typeof nodo === 'object' && nodo !== null ? (nodo.label ?? value) : nodo;
              const key = String(value);
              return (
                <option key={key} value={String(value)}>
                  Nodo {label}
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black dark:text-white mb-1">
            Filtrar por Tipo:
          </label>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="Temperatura">Temperatura</option>
            <option value="Altura">Altura</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black dark:text-white mb-1">
            Fecha Inicio:
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-black dark:text-white mb-1">
            Fecha Fin:
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
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

      <div className="max-h-96 overflow-y-auto">
        <div className="flex flex-col">
          <div className="grid grid-cols-3 rounded-sm bg-gray-200 dark:bg-gray-700 sm:grid-cols-4">
            <div onClick={() => handleSort('nodo')} className="p-2.5 cursor-pointer xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base flex items-center">
                Nodo 
                {sortConfig.key === 'nodo' && (
                  sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>
                )}
              </h5>
            </div>
            <div onClick={() => handleSort('tiempo')} className="p-2.5 text-center cursor-pointer xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base flex justify-center items-center">
                Fecha 
                {sortConfig.key === 'tiempo' && (
                  sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>
                )}
              </h5>
            </div>
            <div onClick={() => handleSort('dato')} className="p-2.5 text-center cursor-pointer xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base flex justify-center items-center">
                Dato 
                {sortConfig.key === 'dato' && (
                  sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>
                )}
              </h5>
            </div>
            <div onClick={() => handleSort('tipo')} className="hidden p-2.5 text-center cursor-pointer sm:block xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base flex justify-center items-center">
                Tipo 
                {sortConfig.key === 'tipo' && (
                  sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>
                )}
              </h5>
            </div>
          </div>

          {paginatedData.map((item) => (
            <div
              className="grid grid-cols-3 sm:grid-cols-4 border-b border-gray-300 dark:border-gray-600"
              key={item.id}
            >
              <div className="flex items-center gap-3 p-2.5 xl:p-5">
                <p className="text-sm font-medium text-black dark:text-white">{item.nodo}</p>
              </div>
              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-sm font-medium text-black dark:text-white">
                  {new Date(item.tiempo).toLocaleString('es-ES')}
                </p>
              </div>
              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-sm font-medium text-black dark:text-white">
                  {Math.round(item.dato * 100) / 100}
                  {Number(item.tipo) === 1 || Number(item.tipo) === 2 ? ' °C' : Number(item.tipo) === 26 ? ' m' : ''}
                </p>
              </div>
              <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Number(item.tipo) === 1 || Number(item.tipo) === 2 ? 'Temperatura' : Number(item.tipo) === 26 ? 'Altura' : 'Otro'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex justify-between items-center">
        <button
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </button>
        <p className="text-sm font-medium">
          Página {currentPage} de {totalPages}
        </p>
        <button
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default TableError;
