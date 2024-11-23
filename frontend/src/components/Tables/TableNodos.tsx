import React, { useState } from 'react';
import AlertPopup from '../AlertPopup';
import '../../css/AlertPopup.css' 
import AdminMaps from '../../pages/Admin/AdminMaps';
import {useNavigate} from 'react-router-dom'
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
//, onEditUptMode
const TableNodos: React.FC<TableNodosProps> = ({ nodos, setNodos }) => {
  const navigate = useNavigate();
  const [alert, setPopUp] = useState<{ message: string; description: string } | null>(null);
  const [selectedNodo, setSelectedNodo] = useState<Nodo | null>(null);
  const [selectedNodoUpt, setSelectedNodoUpt] = useState<Nodo | null>(null);
  const [isViewListNodos, setViewListNodos] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const toggleIsEdit = () => { setIsEdit((prev) => !prev) };
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const toggleDropdown = () => { setViewListNodos((prev) => !prev) };
  const [formData, setFormData] = useState<Nodo>({
    id: 0,
    nombre: '',
    posicionx: 0,
    posiciony: 0,
    descripcion: '',
  });
  
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
    };

    const handleUpdate = async (nodoActualizado: Nodo) => {
      try {
        const response = await fetch(`http://localhost:8000/nodo/${nodoActualizado.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nodoActualizado),
        });
      if (response.ok) {
        setIsEdit(false); // Oculta el panel
        setSelectedNodoUpt(null); // Limpia el nodo seleccionado
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
  setPopUp(null);
};

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
          //onConfirm={deleteNodo}
          onConfirm={() => {
            if (selectedNodo) deleteNodo(selectedNodo); // Elimina el nodo seleccionado
            setPopUp(null); // Cierra la alerta
            if(selectedNodoUpt) handleUpdate(selectedNodoUpt);
            setPopUp(null);
          }}/>
        )}
        </div>
        <div>
          <AdminMaps onLocationChange={handleLocationChange} nodos={nodos} />
        </div>

        <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Lista de nodos</h4>
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
                  onClick={() => {
                    setSelectedNodoUpt(nodo);
                    setFormData(nodo);
                    setIsEdit(true);
                    console.log(setIsEdit);
                  }} >
                  Editar
                </button>

                <button
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={() => {
                    setSelectedNodo(nodo);
                    setPopUp({
                      message: 'Atención!',
                      description: '¿Estás seguro de que deseas eliminar este nodo?',
                    });
                  }} >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
    
      {/* EDICION DE NODOS */}
      {isEdit && (
        <>
            <div className="flex flex-col gap-10">   
             <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(formData); 
                setIsEdit(false);       
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
               <button
                   onClick={() => {
                     handleUpdate(nodo)
                     setSelectedNodoUpt(nodo);
                     setPopUp({
                       message: 'Atención!',
                       description: '¿Estás seguro de que deseas Editar este nodo?',
                     });
                   }} 
                   className="w-full cursor-pointer rounded-lg border p-4 text-white transition hover:bg-opacity-90 bg-primary border-primary"
                   >
                   Modificar nodo
               </button>
             </form> 
           </div>
        </>
        )}
    </>
  );
};
export default TableNodos;