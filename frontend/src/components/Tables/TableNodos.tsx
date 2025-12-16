import React, { useState, useEffect } from 'react';
import AlertPopup from '../AlertPopup';
import '../../css/AlertPopup.css'
import AdminMaps from '../../pages/Admin/AdminMaps'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TrayectoriaModal from '../Modal/TrayectoriaModal';

interface Nodo {
  id: number;
  nombre: string;
  posicionx: number;
  posiciony: number;
  descripcion: string;
  cuenca_id?: number;
  es_movil?: boolean;
}

interface TableNodosProps {
  nodos: Nodo[];
  setNodos: (nodos: Nodo[]) => void;
}

const TableNodos: React.FC<TableNodosProps> = ({ nodos, setNodos }) => {
  const navigate = useNavigate();
  const [alert, setPopUp] = useState<{ message: string; description: string } | null>(null);
  const [selectedNodo, setSelectedNodo] = useState<Nodo | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [filteredNodos, setFilteredNodos] = useState(nodos);
  const [sortDirection, setSortDirection] = useState('asc');
  const [isDelete, setIsDelete] = useState(false);
  const [showTrayectoriaModal, setShowTrayectoriaModal] = useState(false);
  const [nodoTrayectoria, setNodoTrayectoria] = useState<Nodo | null>(null);

  useEffect(() => {
    let filtered = nodos;

    // Filtrar los nodos según el criterio y el valor de búsqueda
    if (selectedFilter && filterValue.trim() !== '') {
      filtered = nodos.filter((nodo) => {
        if (nodo[selectedFilter]) {
          return nodo[selectedFilter]
            .toString()
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        }
        return false;
      });
    }

    // Ordenar los nodos por nombre en la dirección seleccionada
    filtered = filtered.sort((a, b) => {
      const nameA = a.nombre.toLowerCase();
      const nameB = b.nombre.toLowerCase();

      if (sortDirection === 'asc') {
        return nameA > nameB ? 1 : nameA < nameB ? -1 : 0;
      } else {
        return nameA < nameB ? 1 : nameA > nameB ? -1 : 0;
      }
    });
    setFilteredNodos(filtered);

  }, [nodos, selectedFilter, filterValue, sortDirection]);



    const toggleSortDirection = () => {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    };
    

    useEffect(() => {
      obtenerNodos();
    }, []);
    
  const deleteNodo = async (nodo: Nodo) => {
      try {
        const response = await fetch(`http://localhost:8000/nodo/${nodo.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: nodo.id }),
        });

        if (response.ok) {
          setNodos(nodos.filter((n) => n.id !== nodo.id));
          setSelectedNodo(nodos.filter((nodo) => nodo.id !== nodo.id));
          console.log('Nodo eliminado:', nodo);
        } else {
          const errorData = await response.json();
          console.error('Error del servidor:', errorData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
      setPopUp(null);
  };

  const obtenerNodos = async () => {
    try {
        const response = await axios.get('http://localhost:8000/nodos/');
        const nodos = response.data;
        setNodos(nodos);
    } catch (error) {
        console.error('Error al obtener los nodos:', error);
        
        setPopUp({
            message: 'Error',
            description: 'No se pudieron obtener los nodos, contacte con un administrador.',
        });
        
    }
  };

  const handleEditToggle = (nodo: Nodo) => {
    // Navegar al panel de edición dedicado
    navigate('/admin/editar-nodo/' + nodo.id, { state: { nodo } });
  };

  const startDelete = (nodo:Nodo) =>{
    setIsDelete(true);
    setSelectedNodo(nodo);
      setPopUp({
        message: 'Atención!',
        description: '¿Estás seguro de que deseas eliminar este nodo?',
      });
  }
  
  if (nodos.length === 0) {
    return <div>Cargando...</div>;
  }
  return (
    <>
      <div className="Alerta mb-4">
          {alert && (
            <AlertPopup
            message={alert.message}
            description={alert.description}
            onClose={() => setPopUp(null)}
            onConfirm={() => {
              if (selectedNodo) deleteNodo(selectedNodo);
                setPopUp(null);
                setIsDelete(false);
            }}/>
          )}
        </div>
     
      <div className="Alerta mb-4">
        { alert && isDelete &&(
          <AlertPopup
          message={alert.message}
          description={alert.description}
          onClose={() => setPopUp(null)}
          onConfirm={() => {
            if (selectedNodo || isDelete) deleteNodo(selectedNodo); 
             setPopUp(null); 
        }}/>
      )}
      </div>


      <AdminMaps
        onLocationChange={() => {}}
        nodos={nodos}
        onEdit={(nodo) => navigate('/admin/editar-nodo/' + nodo.id, { state: { nodo } })}
        onDelete={startDelete}
        readOnly={true}
        isEditMode={false}
        editingNodoId={null}
      />
        
          <div className="mb-4 sticky top 0 z-10">
            <label htmlFor="filter" className="block mb-3 text-lg font-medium text-gray-900 dark:text-gray-300">
           
              Filtrar por:
            </label>
            <select
              id="filter"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="nombre">Nombre</option>
            </select>
          </div>
          
            {selectedFilter && (
              <div className="mb-4">
                <label htmlFor="filterValue" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                  Buscar:
                </label>
                <input
                  type="text"
                  id="filterValue"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder={`Buscar por ${selectedFilter}`}
                />
              </div>
            )}
             
            <button
              onClick={toggleSortDirection}
              className="bg-blue-500 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95 my-4"
            >
              Ordenar por nombre: {sortDirection === 'asc' ? 'Ascendente' : 'Descendente'}
            </button>
        <div className="flex flex-col" style={{ maxHeight: '400px', overflowY: 'scroll' }}>
          
            {/*
              {nodos.map((nodo) => (
            */}
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
              {filteredNodos.map((nodo) => (
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
            <div className="flex items-center justify-center p-2.5 xl:p-5 space-x-2">
              <button
                className="bg-yellow-500 text-white font-semibold px-3 py-2 rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95 flex items-center"
                onClick={() => {
                  handleEditToggle(nodo);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232a3 3 0 114.243 4.243L7.5 21H3v-4.5l11.732-11.732z"
                  />
                </svg>
                Editar
              </button>

              {nodo.es_movil && (
                <button
                  className="bg-blue-500 text-white font-semibold px-3 py-2 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95 flex items-center"
                  onClick={() => {
                    setNodoTrayectoria(nodo);
                    setShowTrayectoriaModal(true);
                  }}
                  title="Ver trayectoria del nodo móvil"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  Trayectoria
                </button>
              )}

              <button
                className="bg-red-500 text-white font-semibold px-3 py-2 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95 flex items-center"
                onClick={() => {
                  setSelectedNodo(nodo);
                  setPopUp({
                    message: 'Atención!',
                    description: '¿Estás seguro de que deseas eliminar este nodo?',
                  });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L6 7M10 7L10 18M14 7L14 18M18 7L18 18M5 7H19M8 4H16M3 7H21"
                  />
                </svg>
                Eliminar
              </button>

            </div>

          </div>
          
          ))}
      </div>

      {/* Modal de Trayectoria */}
      {showTrayectoriaModal && nodoTrayectoria && (
        <TrayectoriaModal
          nodo={nodoTrayectoria}
          isOpen={showTrayectoriaModal}
          onClose={() => {
            setShowTrayectoriaModal(false);
            setNodoTrayectoria(null);
          }}
        />
      )}
    </>
  );
};
export default TableNodos;