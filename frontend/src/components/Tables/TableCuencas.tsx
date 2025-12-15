import React, { useState, useEffect } from 'react';

interface Cuenca {
  id: number;
  nombre: string;
  descripcion: string;
  poligono: {
    type: string;
    coordinates: number[][][];
  };
}

interface TableCuencasProps {
  cuencas: Cuenca[];
  onEdit: (cuenca: Cuenca) => void;
  onDelete: (cuencaId: number) => void;
}

const TableCuencas: React.FC<TableCuencasProps> = ({ cuencas, onEdit, onDelete }) => {
  const [filteredCuencas, setFilteredCuencas] = useState(cuencas);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let filtered = cuencas;

    // Filtrar por búsqueda
    if (searchTerm.trim() !== '') {
      filtered = cuencas.filter((cuenca) =>
        cuenca.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cuenca.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered = filtered.sort((a, b) => {
      const nameA = a.nombre.toLowerCase();
      const nameB = b.nombre.toLowerCase();

      if (sortDirection === 'asc') {
        return nameA > nameB ? 1 : nameA < nameB ? -1 : 0;
      } else {
        return nameA < nameB ? 1 : nameA > nameB ? -1 : 0;
      }
    });

    setFilteredCuencas(filtered);
  }, [cuencas, searchTerm, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const getCoordinateCount = (cuenca: Cuenca) => {
    try {
      return cuenca.poligono.coordinates[0]?.length || 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="px-4 py-6 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Lista de Cuencas
        </h4>

        {/* Barra de búsqueda y ordenamiento */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar cuenca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-stroke bg-gray px-4 py-2 pl-10 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg
                className="fill-body"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.16666 3.33332C5.945 3.33332 3.33332 5.945 3.33332 9.16666C3.33332 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                />
              </svg>
            </span>
          </div>

          <button
            onClick={toggleSortDirection}
            className="inline-flex items-center gap-2 rounded bg-gray-200 px-4 py-2 text-sm font-medium text-black hover:bg-gray-300 dark:bg-meta-4 dark:text-white dark:hover:bg-meta-3"
          >
            Ordenar {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white">
                ID
              </th>
              <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
                Nombre
              </th>
              <th className="min-w-[250px] px-4 py-4 font-medium text-black dark:text-white">
                Descripción
              </th>
              <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                Cantidad de puntos
              </th>
              <th className="px-4 py-4 font-medium text-black dark:text-white">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCuencas.length === 0 ? (
              <tr>
                <td colSpan={5} className="border-b border-[#eee] px-4 py-5 text-center dark:border-strokedark">
                  <p className="text-black dark:text-white">No hay cuencas registradas</p>
                </td>
              </tr>
            ) : (
              filteredCuencas.map((cuenca) => (
                <tr
                  key={cuenca.id}
                  className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors duration-150 cursor-pointer"
                >
                  <td className="px-4 py-5">
                    <p className="text-black dark:text-white">{cuenca.id}</p>
                  </td>
                  <td className="px-4 py-5">
                    <p className="text-black dark:text-white font-medium">{cuenca.nombre}</p>
                  </td>
                  <td className="px-4 py-5">
                    <p className="text-black dark:text-white">
                      {cuenca.descripcion || '-'}
                    </p>
                  </td>
                  <td className="px-4 py-5">
                    <p className="text-sm text-black dark:text-white">
                      {getCoordinateCount(cuenca)} puntos
                    </p>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(cuenca)}
                        className="inline-flex items-center justify-center rounded bg-primary px-3 py-2 text-center font-medium text-white hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Editar cuenca"
                      >
                        <svg
                          className="fill-current mr-1"
                          width="16"
                          height="16"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M16.6667 3.33332L14.6667 1.33332L5.00001 11L5.00001 13L7.00001 13L16.6667 3.33332Z"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M13 15H3C2.44772 15 2 14.5523 2 14V4C2 3.44772 2.44772 3 3 3H8"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(cuenca.id)}
                        className="inline-flex items-center justify-center rounded bg-danger px-3 py-2 text-center font-medium text-white hover:bg-opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Eliminar cuenca"
                      >
                        <svg
                          className="fill-current mr-1"
                          width="16"
                          height="16"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                          />
                          <path
                            d="M9.00039 9.11255C8.66289 9.11255 8.35352 9.3938 8.35352 9.75942V13.3313C8.35352 13.6688 8.63477 13.9782 9.00039 13.9782C9.33789 13.9782 9.64727 13.6969 9.64727 13.3313V9.75942C9.64727 9.3938 9.33789 9.11255 9.00039 9.11255Z"
                          />
                          <path
                            d="M11.2502 9.67504C10.8846 9.64692 10.6033 9.90004 10.5752 10.2657L10.4064 12.7407C10.3783 13.0782 10.6314 13.3875 10.9971 13.4157C11.0252 13.4157 11.0252 13.4157 11.0533 13.4157C11.3908 13.4157 11.6721 13.1625 11.6721 12.825L11.8408 10.35C11.8408 9.98442 11.5877 9.70317 11.2502 9.67504Z"
                          />
                          <path
                            d="M6.72245 9.67504C6.38495 9.70317 6.1037 10.0125 6.13182 10.35L6.3287 12.825C6.35683 13.1625 6.63808 13.4157 6.94745 13.4157C6.97558 13.4157 6.97558 13.4157 7.0037 13.4157C7.3412 13.3875 7.62245 13.0782 7.59433 12.7407L7.39745 10.2657C7.39745 9.90004 7.08808 9.64692 6.72245 9.67504Z"
                          />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-4 md:px-6 xl:px-7.5">
        <p className="text-sm text-black dark:text-white">
          Mostrando {filteredCuencas.length} de {cuencas.length} cuencas
        </p>
      </div>
    </div>
  );
};

export default TableCuencas;
