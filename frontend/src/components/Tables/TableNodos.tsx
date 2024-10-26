import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Nodo {
  id: number;
  posicionx: number;
  posiciony: number;
}

const TableNodos: React.FC = () => {
  const [nodosData, setNodosData] = useState<Nodo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const eliminarNodo = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:8000/nodo/${id}`, {
          method: "DELETE", 
          headers: {
              "Content-Type": "application/json", // Indica que envías JSON
          },
          body: JSON.stringify({ id }), // Convierte el id en un objeto JSON
      });
      alert("Nodo eliminado con exito.");
      if (response.ok) {
          const responseData = await response.json(); // Si la respuesta es correcta, obtienes los datos
          console.log("Nodo eliminado:", responseData); // Manejo de la respuesta exitosa
      } else {
          const errorData = await response.json(); // Si hay un error, obtienes los datos del error
          console.error("Error del servidor:", errorData); // Manejo del error
      }
  } catch (error) {
      console.error("Error:", error); // Manejo de errores de red
  }

  }

  useEffect(() => {
    const obtenerNodos = async () => {
      try {
        const response = await axios.get('http://localhost:8000/nodos/');
        const nodos = response.data;
        setNodosData(nodos);
      } catch (error) {
        console.error('Error al obtener los nodos:', error);
        setError('Error al cargar los datos.');
      }
    };

    obtenerNodos();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (nodosData.length === 0) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Nodos de la red
      </h4>

      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Id</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">X</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Y</h5>
          </div>
        </div>

        {nodosData.map((nodo) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-5 border-b border-stroke dark:border-strokedark`}
            key={nodo.id}
          >
          <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{nodo.id}</p>
          </div>
          <div className="flex items-center gap-3 p-2.5 xl:p-5">
            <p className="text-black dark:text-white">{nodo.posicionx}</p>
          </div>
          <div className="flex items-center justify-center p-2.5 xl:p-5">
            <p className="text-black dark:text-white">{nodo.posiciony}</p>
          </div>
          <div className="flex items-center justify-center p-2.5 xl:p-5">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => eliminarNodo(nodo.id)} // Llamada a la función de eliminar
          >
            Eliminar
          </button>
        </div>
        </div>
        ))}
      </div>
    </div>
  );
};

export default TableNodos;
