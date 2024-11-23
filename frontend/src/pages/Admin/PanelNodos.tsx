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
  const [alert, setPopUp] = useState<{type:''; message: string; description: string; onConfirm: () => void;
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

  const handleLocationChange = (lat: number, lng: number) => {
    setLat(lat);
    setLng(lng);
  };

  const handleCreateNodo = () =>{
    navigate('/admin/create-nodo');
  }
  
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
        {/**
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
        */}

        const response = await fetch(`http://localhost:8000/nodo/${data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: data.id }),
        });
        if (response.ok) {
          //const newNode = await response.json();
          obtenerNodos();
          //setNodos((prevNodos) => [...prevNodos, newNode]); // Añade el nodo nuevo a nodos
          toggleEditMode();
          
                {/*
            setTimeout(() => {
              setPopUp({ type: '', message: '', description: '' });
            }, 3000); // 3 segundos
          */}
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
  console.log(lat, lng)

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
    
      {/* ALERTA */}
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
       


          {/* TableNodos.tsx */}
          <TableNodos
            nodos={nodos}
            setNodos={setNodos}
            onEditUptMode={onEditUptMode}
          />
          
          <div className="md:w-1/2">
        <button
          onClick={handleCreateNodo}
          className="bg-primary text-white px-4 py-2 rounded-lg focus:outline-none hover:bg-primary-dark transition"
         >
          Crear Nodo
          </button>
        </div>
    
           
    </>
  );
};
export default PanelNodos;
