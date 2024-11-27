import React, { useState, useEffect, useRef } from 'react';
import AlertPopup from '../AlertPopup';
import '../../css/AlertPopup.css' 
import AdminMaps from '../../pages/Admin/AdminMaps' 
import {useNavigate} from 'react-router-dom'
import axios from 'axios';
import { isDataView } from 'util/types';
import { isDeepStrictEqual } from 'util';

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
  const navigate = useNavigate();
  const [alert, setPopUp] = useState<{ message: string; description: string } | null>(null);
  const [selectedNodo, setSelectedNodo] = useState<Nodo | null>(null);
  const [selectedNodoUpt, setSelectedNodoUpt] = useState<Nodo | null>(null);
  const [isViewListNodos, setViewListNodos] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const toggleIsEdit = () => { setIsEdit((prev) => !prev) };
  const [ isUpdate, setIsUpdate ]=useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState(""); 
  const [filterValue, setFilterValue] = useState(""); 
  const [filteredNodos, setFilteredNodos] = useState(nodos);
  const [sortDirection, setSortDirection] = useState('asc'); 
  const editFormRef = useRef<HTMLDivElement | null>(null);
  const [isDelete, setIsDelete] = useState(false);
  const [formData, setFormData] = useState<Nodo>({
    id: 0,
    nombre: '',
    posicionx: 0,
    posiciony: 0, 
    descripcion: '',
  });

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
    
    const showAlert = (nodo: Nodo) => {
      setSelectedNodo(nodo);
      setPopUp({
        message: 'Atención!',
        description: 'La eliminación del nodo es permanente.',
      });
    };

    const handleLocationChange = (lat: number, lng: number) => {
      setLat(lat);
      setLng(lng);
      
    setFormData((prevFormData) => ({
      ...prevFormData,
      posicionx: lat,
      posiciony: lng,
      }));
    };

    const handleUpdate = async (nodoUpd: Nodo) => {
      debugger;
      setSelectedNodoUpt(nodoUpd);
      try {
        const response = await fetch(`http://localhost:8000/nodo/${nodoUpd.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nodoUpd),
        });
      if (response.ok) {
        obtenerNodos();
        setNodos(nodos.filter((n) => n.id !== nodoUpd.id));
        setSelectedNodoUpt(nodos.filter((nodoUpd) => nodoUpd.id !== nodoUpd.id));
        //showAlert('success', isEdit ? 'Nodo modificado correctamente' : 'Nodo creado correctamente', 'El nodo se ha guardado con éxito.');
        {/**
          setTimeout(() => {
            setPopUp({ type: '', message: '', description: '' });
          }, 3000); // 3 segundos
        */}     
      } else {
          const errorData = await response.json();
          console.error('Error del servidor:', errorData);
          showAlert('error', 'Error al guardar el nodo', 'Hubo un problema al guardar el nodo.');
      }
      } catch (error) {
        console.error('Error:', error);
      }
    setIsEdit(false)
    setIsUpdate(false);
    setPopUp(null);
  };

    useEffect(() => {
      if (isEdit && editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    
      if (lat !== null && lng !== null) {
        setFormData((prevFormData) => ({
          ...prevFormData,
          posicionx: parseFloat(lat.toString()),  
          posiciony: parseFloat(lng.toString()),  
        }));
      }
      obtenerNodos();
    }, [isEdit, lat, lng]);
    
  const deleteNodo = async ( nodo: Nodo) => {
      debugger;
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
    debugger;
    setIsUpdate(true)
    if (isEdit && !isUpdate ) {
      setSelectedNodoUpt(null);
      setFormData({
        id: 0,
        nombre: '',
        posicionx: 0,
        posiciony: 0,
        descripcion: '',
      }); 
      setIsEdit(false); 
    } else {
      setSelectedNodoUpt(nodo);
      setFormData(nodo);
      onEditUptMode(nodo);
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      setIsEdit(true);
    }
    
  };

  const startEdit = (nodo: Nodo) => {
    setSelectedNodoUpt(nodo); 
    setFormData(nodo);      
    onEditUptMode(nodo);    
    setIsEdit(true); 
  };

  const startDelete = (nodo:Nodo) =>{
    setIsDelete(true);
    setSelectedNodo(nodo); 
      setPopUp({
        message: 'Atención!',
        description: '¿Estás seguro de que deseas eliminar este nodo?',
      });
  }

  const cancelEdit = () => {
    setFormData({
      id: 0,
      nombre: '',
      posicionx: 0,
      posiciony: 0,
      descripcion: '',
    });
    setSelectedNodoUpt(null);
    setIsEdit(false);
    setIsUpdate(false)
  };
  
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
              if(selectedNodoUpt) handleUpdate(selectedNodoUpt); 
              
              
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


      {!isEdit &&(
        <AdminMaps onLocationChange={handleLocationChange} nodos={nodos} onEdit={startEdit} onDelete={startDelete}/>
        )}
        
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
            <div className="flex items-center justify-center p-2.5 xl:p-5 space-x-5">
              <button
                className="bg-yellow-500 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95 flex items-center"
                onClick={() => {
                  handleEditToggle(nodo);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
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

              <button
                className="w-full bg-red-500 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95 flex items-center"
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
                  className="h-5 w-5 mr-2"
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
    
      {/* EDICION DE NODOS */}
      {isEdit && selectedNodoUpt &&(
        <>
            <div className="flex flex-col gap-10" ref={editFormRef} >   
             <form onSubmit={(e) => {
                e.preventDefault();
                setSelectedNodoUpt(formData);
                setPopUp({
                  message: 'Atención!',
                  description: '¿Estás seguro de que deseas editar el nodo?',
              });       
             }}>
               <div className="mb-4">
                 <div className="relative">
                   <span className="absolute right-4 top-4">
                     <svg
                       className="fill-current"
                       width="22"
                       height="22"
                       viewBox="0 0 22 22"
                       fill="none"
                       xmlns="http://www.w3.org/2000/svg"
                     >
                     </svg>
                   </span>
                 </div>
               </div>
               <div className="mb-4">
                 <label className="mb-2.5 block font-medium text-black dark:text-white">
                   Nombre
                 </label>
                 <div className="relative">
                   <input
                     type="text"
                     id="nombre"
                     name="nombre"
                     placeholder="Ingrese el nombre del nodo"
                     onChange={(e) =>
                       setFormData({ ...formData, nombre: e.target.value })
                     }
                     value={formData.nombre}
                     className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                   />

                   <span className="absolute right-4 top-4">
                     <svg
                       className="fill-current"
                       width="22"
                       height="22"
                       viewBox="0 0 22 22"
                       fill="none"
                       xmlns="http://www.w3.org/2000/svg"
                     >
                     </svg>
                   </span>
                 </div>
               </div>
               <div className="mb-4">
                 <label className="mb-2.5 block font-medium text-black dark:text-white">
                   Coordenada X
                 </label>
                 <div className="relative">
                   <input
                     type="number"
                     id="posicionx"
                     name="posicionx"
                     placeholder="Ingrese la posición X del nodo"
                     onChange={(e) =>
                       setFormData({ ...formData, posicionx: e.target.value })
                     }
                     value={formData.posicionx}
                     className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                   />

                   <span className="absolute right-4 top-4">
                     <svg
                       className="fill-current"
                       width="22"
                       height="22"
                       viewBox="0 0 22 22"
                       fill="none"
                       xmlns="http://www.w3.org/2000/svg"
                     >
                     </svg>
                   </span>
                 </div>
               </div>

               <div className="mb-4">
                 <label className="mb-2.5 block font-medium text-black dark:text-white">
                   Coordenada Y
                 </label>
                 <div className="relative">
                   <input
                     type="number"
                     name="posiciony"
                     id="posiciony"
                     placeholder="Ingrese la posición Y del nodo"
                     className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                     onChange={(e) =>
                       setFormData({ ...formData, posiciony: e.target.value })
                     }
                     value={formData.posiciony}
                   />

                   <span className="absolute right-4 top-4">
                     <svg
                       className="fill-current"
                       width="22"
                       height="22"
                       viewBox="0 0 22 22"
                       fill="none"
                       xmlns="http://www.w3.org/2000/svg"
                     >
                     </svg>
                   </span>
                 </div>
               </div>
               <div className="mb-4">
                 <label className="mb-2.5 block font-medium text-black dark:text-white">
                   Descripción(opcional)
                 </label>
                 <div className="relative">
                   <input
                     type="string"
                     id="descripcion"
                     name="descripcion"
                     placeholder="Ingrese una descripción"
                     onChange={(e) =>
                       setFormData({ ...formData, descripcion: e.target.value })
                     }
                     value={formData.descripcion}
                     className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                   />

                   <span className="absolute right-4 top-4">
                     <svg
                       className="fill-current"
                       width="22"
                       height="22"
                       viewBox="0 0 22 22"
                       fill="none"
                       xmlns="http://www.w3.org/2000/svg"
                     >
                     </svg>
                   </span>
                 </div>
               </div>
               <h1>Seleccione coordenadas</h1>
               <div className="flex space-x-4">
              <AdminMaps onLocationChange={handleLocationChange} nodos={nodos} onEdit={handleUpdate} onDelete={deleteNodo}/>
              </div>
               < div className="mt-10">
                  <button
                    type="submit"
                    className="w-full bg-yellow-500 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95"
                    //""
                  > 
                  Modificar nodo
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="w-full bg-red-500 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95">
                    Cancelar
                  </button> 
               </div>
             </form> 
           </div>
        </>
        )}
    </>
  );
};
export default TableNodos;