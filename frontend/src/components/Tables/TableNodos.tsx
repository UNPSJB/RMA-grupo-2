import React, { useEffect, useState } from 'react';
import axios from 'axios';

<<<<<<< HEAD

interface Nodo {
  id: number;
  posicionx: number;
  posiciony: number;
}

interface onEditUptMode {
  onEditUptMode: (nodo: Nodo) => void;
}

const TableNodos: React.FC <{ onEditUptMode: (nodo: Nodo) => void }> = ({ onEditUptMode })=> {
=======
interface Nodo {
  id: number;
  nombre:string;
  posicionx: number;
  posiciony: number;
  descripcion: string;
}

const TableNodos: React.FC = () => {
>>>>>>> 8fd5d8d2ab2449ab92222f8aef71f272764d27bd
  const [nodosData, setNodosData] = useState<Nodo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const eliminarNodo = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:8000/nodo/${id}`, {
          method: "DELETE", 
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }), 
      });
      alert("Nodo eliminado con exito.");
      if (response.ok) {
          const responseData = await response.json(); 
          console.log("Nodo eliminado:", responseData);
      } else {
          const errorData = await response.json(); 
          console.error("Error del servidor:", errorData);
      }
  } catch (error) {
      console.error("Error:", error); 
<<<<<<< HEAD
  }}

  
  const modificarNodo = async (nodo: Nodo): Promise<void> => {
    try {      
      const response = await fetch(`http://localhost:8000/nodo/${nodo.id}`, {
          method: "PUT", 
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ nodo }), 
      });
      if (response.ok) {
          alert("Nodo modificado con exito.");
          const responseData = await response.json(); 
          console.log("Nodo modificado:", responseData);
      } else {
          const errorData = await response.json(); 
          console.error("Error del servidor:", errorData);
      }
  } catch (error) {
      console.error("Error:", error); 
  }}

=======
  }

  }
>>>>>>> 8fd5d8d2ab2449ab92222f8aef71f272764d27bd

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
<<<<<<< HEAD
            <h5 className="text-sm font-medium uppercase xsm:text-base">Id</h5>
=======
            <h5 className="text-sm font-medium uppercase xsm:text-base">Nombre</h5>
>>>>>>> 8fd5d8d2ab2449ab92222f8aef71f272764d27bd
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">X</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Y</h5>
          </div>
<<<<<<< HEAD
=======
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Descripcion</h5>
          </div>
>>>>>>> 8fd5d8d2ab2449ab92222f8aef71f272764d27bd
        </div>

        {nodosData.map((nodo) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-5 border-b border-stroke dark:border-strokedark`}
            key={nodo.id}
          >
          <div className="flex items-center gap-3 p-2.5 xl:p-5">
<<<<<<< HEAD
              <p className="text-black dark:text-white">{nodo.id}</p>
=======
              <p className="text-black dark:text-white">{nodo.nombre}</p>
>>>>>>> 8fd5d8d2ab2449ab92222f8aef71f272764d27bd
          </div>
          <div className="flex items-center gap-3 p-2.5 xl:p-5">
            <p className="text-black dark:text-white">{nodo.posicionx}</p>
          </div>
          <div className="flex items-center justify-center p-2.5 xl:p-5">
<<<<<<< HEAD
            <p className="text-black dark:text-white">{ nodo.posiciony}</p>
          </div>
          <div className="flex items-center justify-center p-2.5 xl:p-5 space-x-17">
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded"
            onClick={() => onEditUptMode(nodo)}
          >
            Editar
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => eliminarNodo(nodo.id)} 
=======
            <p className="text-black dark:text-white">{nodo.posiciony}</p>
          </div>
          <div className="flex items-center justify-center p-2.5 xl:p-5">
            <p className="text-black dark:text-white">{nodo.descripcion}</p>
          </div>
          <div className="flex items-center justify-center p-2.5 xl:p-5">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => eliminarNodo(nodo.id)} // Llamada a la función de eliminar
>>>>>>> 8fd5d8d2ab2449ab92222f8aef71f272764d27bd
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
