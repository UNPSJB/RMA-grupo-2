import React, { useEffect, useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import TableNodos from '../../components/Tables/TableNodos';
import AdminMaps from '../../pages/Admin/AdminMaps';
import '../../css/AlertPopup.css';
import AlertPopup from '../../components/AlertPopup'
import AlertMensaje from '../../components/Alerts/'
import axios from 'axios';
import {useNavigate} from 'react-router-dom'

interface Nodo {
  id: number;
  nombre: string;
  posicionx: number;
  posiciony: number;
  descripcion: string;  
}

const CrearNodo = () => {
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState(false);
  const [nodos, setNodos] = useState<Nodo[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [ isViewCreateNodo, setViewCreateNodo ] = useState(false);
  const toggleDropdown = () => { setViewCreateNodo((prev) => !prev) }; 
  const [alert, setPopUp] = useState<{type: string; message: string; description: string; onConfirm: () => void;
  } | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    posicionx: '',
    posiciony: '',
    descripcion: '',    
  });
    
  {/**
    const showAlert = (type: 'success' | 'error' | 'info' | 'warning', message: string, description = '') => {
        setPopUp({ type, message, description});
    };
    
    const confirmAction = (message: string, description: string, onConfirm: () => void) => {
        setPopUp({ message, description, onConfirm });
    };
*/}

 {/**
    const onEditUptMode = (nodo: Nodo) => {
        setFormData({
            id: nodo.id.toString(),
            nombre: nodo.nombre,
            posicionx: nodo.posicionx.toString(),
            posiciony: nodo.posiciony.toString(),
            descripcion: nodo.descripcion,      
        });
        setIsEdit(true);
    };
    
    const toggleEditMode = () => {
        setIsEdit(false);
        setFormData({
            id: '',
            nombre: '',
            posicionx: '',
            posiciony: '',
            descripcion: '',      
        });
    };
*/}
    
    const handleLocationChange = (lat: number, lng: number) => {
        setLat(lat);
        setLng(lng);
  };

  useEffect(() => {
    if (lat !== null && lng !== null) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        posicionx: lat.toString(),
        posiciony: lng.toString(),
      }));
    }
    
  }, [lat, lng]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = {
      id: formData.id,
      nombre: formData.nombre,
      posicionx: formData.posicionx,
      posiciony: formData.posiciony,
      descripcion: formData.descripcion,    
    };
    debugger;
  
    {/**
      if (isEdit) {
          setPopUp({
            type: 'warning',
            message: '¿Estás seguro de que quieres modificar el nodo?',
            description: 'Esta acción no se puede deshacer.',
          });
          
          //showAlert('success', 'Nodo modificado correctamente', 'Los cambios se guardaron con éxito.');
        }else {
    */}
    
        {/**
          setPopUp({
            type: 'warning',
            message: '¿Estás seguro de que quieres crear el nodo?',
            description: 'Esta acción no se puede deshacer.',
          });
        */}
          
        //showAlert('success', 'Nodo creado correctamente', 'El nodo ha sido creado con éxito.');
   
            {/**
            if (!formData.posicionx || !formData.posiciony || !formData.nombre) {
                setPopUp({
                    type: 'warning',
                    message: 'Atencion!',
                    description: 'Debe rellenar todos los campos.',
                });
                return;  
            }
        */}

      try {
        const response = await fetch('http://localhost:8000/nodo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      
        if (response.ok) {
          setIsEdit(false);
      {/**
        showAlert(
            'success',
            isEdit ? 'Nodo modificado correctamente' : 'Nodo creado correctamente',
            'El nodo se ha guardado con éxito.'
            );
            setTimeout(() => {
                setPopUp(null);
            }, 3000);
        */}
        } else {
          const errorData = await response.json();
          console.error('Error del servidor:', errorData);
      
          //showAlert('error', 'Error al guardar el nodo', 'Hubo un problema al guardar el nodo.');
        }
      } catch (error) {
        console.error('Error:', error);
        //showAlert('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
      } finally {
        setIsEdit(false);
        setPopUp(null);
        navigate('/admin/nodos');
      }      
  };
  
  {/**
  const obtenerNodos = async () => {
      try {
          const response = await axios.get('http://localhost:8000/nodos/');
          const nodos = response.data;
          setNodos(nodos);
        } catch (error) {
            console.error('Error al obtener los nodos:', error);
            
            setPopUp({
                type: 'error',
                message: 'Error',
                description: 'No se pudieron obtener los nodos, contacte con un administrador.',
            });
            
        }
    };
    */}

    {/**
        useEffect(() => {
            if (lat !== null && lng !== null) {
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    posicionx: lat.toString(),
                    posiciony: lng.toString(),
                }));
            }
            //obtenerNodos();
        }, [lat, lng]);
    */}
    
  return (
    <>
        <Breadcrumb pageName="Nodos" />

        {/* ALERTA
        <div className="Alerta mb-4">
        {alert?.message && (
            <AlertPopup
            type={alert.type}
            message={alert.message}
            description={alert.description}
            onClose={() => {handleCancel}}
            onConfirm={() => {
                setConfirmAction(true)
            }}
            />
        )}
        </div>
            */}

          
        {/* VISTA CREACION  NODO */}
        
        <div className="flex flex-col gap-10">   
            <form onSubmit={handleSubmit}>
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
             <AdminMaps onLocationChange={handleLocationChange} nodos={nodos} />
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
             

             <div className="md:w-1/2">
            <button
              onClick={handleSubmit}
              className="bg-green-500 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition transform hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Crear Nodo
            </button>
          </div>       
           
            </form> 
        </div>
    </>
  );
};
export default CrearNodo;
