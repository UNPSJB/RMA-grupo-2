import React, { useState } from 'react';
import AlertPopup from '../popUp';

interface Nodo {
  id: number;
  nombre: string;
  posicionx: number;
  posiciony: number;
  descripcion: string;  
}

interface TableNodosProps {
  nodos: Nodo[];
  setNodos: (nodos: Nodo[]) => void;
  onEditUptMode: (nodo: Nodo) => void;
}

const TableNodos: React.FC<TableNodosProps> = ({ nodos, setNodos, onEditUptMode }) => {
  const [alert, setPopUp] = useState<{ message: string; description: string } | null>(null);
  const [selectedNodo, setSelectedNodo] = useState<Nodo | null>(null);

  const showAlert = (nodo: Nodo) => {
    setSelectedNodo(nodo);
    setPopUp({
      message: 'Atención!',
      description: 'La eliminación del nodo es permanente.',
    });
  };

  const deleteNodo = async () => {
    if (!selectedNodo) return;
    try {
      const response = await fetch(`http://localhost:8000/nodo/${selectedNodo.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedNodo.id }),
      });

      if (response.ok) {
        setNodos(nodos.filter((nodo) => nodo.id !== selectedNodo.id));
        console.log('Nodo eliminado:', selectedNodo);
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setPopUp(null);
  };

  if (nodos.length === 0) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Lista de nodos
      </h4>
      
      {}
      <div className="Alerta mb-4">
        {alert && (
          <AlertPopup
            message={alert.message}
            description={alert.description}
            onClose={() => setPopUp(null)}
            onConfirm={deleteNodo}
          />
        )}
      </div>

      <div className="flex flex-col" style={{ maxHeight: '400px', overflowY: 'scroll' }}>
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5 sticky top-0 z-10">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Nombre</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Latitud</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Longitud</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Descripción</h5>
          </div>
        </div>

        {nodos.map((nodo) => (
          <div className="grid grid-cols-3 sm:grid-cols-5 border-b border-stroke dark:border-strokedark" key={nodo.id}>
            <div className="flex items-center  gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{nodo.nombre}</p>
            </div>
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{nodo.posicionx}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{nodo.posiciony}</p>
            </div>
            <div className="flex items-center justify-center gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{nodo.descripcion}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5 space-x-5">
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={() => onEditUptMode(nodo)}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => showAlert(nodo)}
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