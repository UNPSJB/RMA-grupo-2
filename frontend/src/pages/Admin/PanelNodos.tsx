import React, { useEffect, useState } from 'react';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import TableNodos from '../../components/Tables/TableNodos';
import AdminMaps from '../Admin/AdminMaps';
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

const PanelNodos = () => {
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState(false);
  const [nodos, setNodos] = useState<Nodo[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [ isViewCreateNodo, setViewCreateNodo ] = useState(false);
  const toggleDropdown = () => { setViewCreateNodo((prev) => !prev) }; 
  const [alert, setPopUp] = useState<{message: string; description: string; onConfirm: () => void;
  } | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    posicionx: '',
    posiciony: '',
    descripcion: '',    
  });

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

  const handleCreateNodo = () =>{
    navigate('/admin/crear-nodo');
  }
  
  const obtenerNodos = async () => {
    try {
      const response = await axios.get('http://localhost:8000/nodos/');
      const nodos = response.data;
      setNodos(nodos);
    } catch (error) {
      console.error('Error al obtener los nodos:', error);      
      {/**
        setPopUp({
          type: 'error',
          message: 'Error',
          description: 'No se pudieron obtener los nodos, contacte con un administrador.',
        });
      */}
      
    }
  };
  {/**
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      const data = {
      id: formData.id,
      nombre: formData.nombre,
      posicionx: formData.posicionx,
      posiciony: formData.posiciony,
      descripcion: formData.descripcion,  
      bateria: null    
    };
    debugger;
  

      try {
        const url = isEdit
        ? `http://localhost:8000/nodo/${data.id}`
        : 'http://localhost:8000/nodo';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
      try{
        const response = await fetch(`http://localhost:8000/nodo/${data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: data.id }),
        });
        if (response.ok) {
          const newNode = await response.json();
          //obtenerNodos();
          setNodos((prevNodos) => [...prevNodos, newNode]); // Añade el nodo nuevo a nodos
          toggleEditMode();
          
               
            setTimeout(() => {
              setPopUp({ type: '', message: '', description: '' });
            }, 3000); // 3 segundos
            //showAlert('success', isEdit ? 'Nodo modificado correctamente' : 'Nodo creado correctamente', 'El nodo se ha guardado con éxito.');
            
          } else {
            const errorData = await response.json();
            console.error('Error del servidor:', errorData);
            
          }
        } catch (error) {
      console.error('Error:', error);
    }
    setIsEdit(false);
    
  };
*/}
  
  useEffect(() => {
    if (lat !== null && lng !== null) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        posicionx: lat.toString(),
        posiciony: lng.toString(),
      }));
    }
    obtenerNodos();
  }, [lat, lng]);
  
  
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
            onClose={() => {}}
            onConfirm={() => {
              //setConfirmAction(true)
            }}
          />
        )}
      </div>
            */}
          <div className="md:w-1/2">
            <button
              onClick={handleCreateNodo}
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

          {/* TableNodos.tsx */}
          <TableNodos
            nodos={nodos}
            setNodos={setNodos}
            onEditUptMode={onEditUptMode}
          />
          
        
    </>
  );
};
export default PanelNodos;
