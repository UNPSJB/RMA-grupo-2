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

const TableTwo: React.FC = () => {
  const [medicionData, setMedicionData] = useState<Medicion[]>([]);
  const [filteredData, setFilteredData] = useState<Medicion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [nodoFilter, setNodoFilter] = useState<number | ''>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Medicion; direction: 'asc' | 'desc' }>({ key: 'tiempo', direction: 'asc' });

  useEffect(() => {
    const obtenerMediciones = async () => {
      try {
        const response = await axios.get('http://localhost:8000/medicion/');
        setMedicionData(response.data);
        setFilteredData(response.data);
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
      'ID', 
      'Nodo', 
      'Tipo de Medición', 
      'Dato (con unidad)', 
      'Fecha y Hora'
    ];

    const rows = filteredData.map(item => [
      item.id,
      item.nodo,
      item.tipo === 1 || item.tipo === 2 ? 'Temperatura' : item.tipo === 25 ? 'Altura' : 'Otro',
      `${Math.round(item.dato * 100) / 100}${item.tipo === 1 || item.tipo === 2 ? ' °C' : item.tipo === 25 ? ' m' : ''}`,
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
    link.setAttribute('download', 'mediciones.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  

  if (error) {
    return <div>{error}</div>;
  }

  if (medicionData.length === 0) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Historial de Mediciones
      </h4>


      <div className="mb-4 flex gap-4">
        <div>
          <label className="text-sm font-medium text-black dark:text-white">
            Filtrar por Nodo:
          </label>
          <input
            type="number"
            value={nodoFilter}
            onChange={(e) => setNodoFilter(e.target.value ? Number(e.target.value) : '')}
            className="ml-2 px-2 py-1 border rounded"
            placeholder="Número de nodo"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-black dark:text-white">
            Filtrar por Tipo:
          </label>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="ml-2 px-2 py-1 border rounded"
          >
            <option value="">Todos</option>
            <option value="Temperatura">Temperatura</option>
            <option value="Altura">Altura</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-black dark:text-white">
            Fecha Inicio:
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="ml-2 px-2 py-1 border rounded"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-black dark:text-white">
            Fecha Fin:
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="ml-2 px-2 py-1 border rounded"
          />
        </div>
      </div>

      <button onClick={downloadCSV} className="mb-4 px-4 py-2 text-sm text-white bg-green-500 rounded">
        Descargar CSV
      </button>

      <div className="max-h-96 overflow-y-auto">
        <div className="flex flex-col">
          <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
            <div onClick={() => handleSort('nodo')} className="p-2.5 cursor-pointer xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Nodo {sortConfig?.key === 'nodo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </h5>
            </div>
            <div onClick={() => handleSort('tiempo')} className="p-2.5 text-center cursor-pointer xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Fecha {sortConfig?.key === 'tiempo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </h5>
            </div>
            <div onClick={() => handleSort('dato')} className="p-2.5 text-center cursor-pointer xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Dato {sortConfig?.key === 'dato' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </h5>
            </div>
            <div onClick={() => handleSort('tipo')} className="hidden p-2.5 text-center cursor-pointer sm:block xl:p-5">
              <h5 className="text-sm font-medium uppercase xsm:text-base">
                Tipo {sortConfig?.key === 'tipo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </h5>
            </div>
          </div>

          {paginatedData.map(item => (
            <div
              className="grid grid-cols-3 sm:grid-cols-4 border-b border-stroke dark:border-strokedark"
              key={item.id}
            >
              <div className="flex items-center gap-3 p-2.5 xl:p-5">
                <p className="text-black dark:text-white">{item.nodo}</p>
              </div>
              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-black dark:text-white">{new Date(item.tiempo).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center justify-center p-2.5 xl:p-5">
                <p className="text-meta-3">
                  {Math.round(item.dato * 100) / 100}
                  {item.tipo === 1 || item.tipo === 2 ? ' °C' : item.tipo === 25 ? ' m' : ''}
                </p>
              </div>
              <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
                <p className="text-black dark:text-white">
                  {item.tipo === 1 || item.tipo === 2 ? 'Temperatura' : item.tipo === 25 ? 'Altura' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className="flex justify-center mt-4">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 mx-1 text-sm text-white bg-blue-500 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="px-4 py-2 mx-1 text-sm text-black">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 mx-1 text-sm text-white bg-blue-500 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default TableTwo;
