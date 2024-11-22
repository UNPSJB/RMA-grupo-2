import React, { useEffect, useState } from 'react';

interface Nodo {
  id: number;
  nombre: string;
  posicionx: number;
  posiciony: number;
  descripcion: string;
}

const TableThree: React.FC = () => {
  const [nodos, setNodos] = useState<Nodo[]>([]);

  useEffect(() => {
    // Función para obtener los nodos desde el backend
    const fetchNodos = async () => {
      try {
        const response = await fetch('http://localhost:8000/nodos');
        if (!response.ok) {
          throw new Error('Error al obtener los nodos');
        }
        const data = await response.json();
        setNodos(data); // Guarda los datos en el estado
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchNodos(); // Llama a la función cuando el componente se monta
  }, []); // Solo se ejecuta una vez al montar el componente

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                ID
              </th>
              <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white">
                Nombre
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                Longitud
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                Latitud
              </th>
              <th className="min-w-[250px] py-4 px-4 font-medium text-black dark:text-white">
                Descripción
              </th>
            </tr>
          </thead>
          <tbody>
            {nodos.map((nodo) => (
              <tr key={nodo.id}>
                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  {nodo.id}
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <h5 className="font-medium text-black dark:text-white">
                    {nodo.nombre}
                  </h5>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  {nodo.posicionx}
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  {nodo.posiciony}
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  {nodo.descripcion}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableThree;
