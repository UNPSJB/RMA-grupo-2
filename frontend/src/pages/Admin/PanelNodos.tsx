import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import TableNodos from '../../components/Tables/TableNodos';
import AdminMaps from '../Admin/AdminMaps'
import Alerts from '../../components/alerts'
import React, { useEffect, useState } from 'react';

import axios from 'axios';

interface Nodo {
  id: number;
  nombre: string;
  posicionx: number;
  posiciony: number;
  descripcion: string;  
}

const PanelNodos = () => {
  const [alertMsg, setAlert] = useState({
    type: '',
    message: '',
    description: '',
  });
  const [isEdit, setIsEdit] = useState(false);
  const [nodos, setNodos] = useState<Nodo[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
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

    if (!formData.posicionx || !formData.posiciony || !formData.nombre) {
      setAlert({
        type: 'warning',
        message: 'Atencion!',
        description: 'Debe rellenar todos los campos.',
      });
      return;
    }
    
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
      if (response.ok) {
        const newNode = await response.json();
        setFormData({
          id: '',
          nombre: '',
          posicionx: '',
          posiciony: '',
          descripcion: '',          
        });
        setIsEdit(false);
        obtenerNodos();
        setNodos((prevNodos) => [...prevNodos, newNode]); // Añade el nodo nuevo a nodos
        toggleEditMode();
        setAlert({
          type: 'success',
          message: isEdit ? 'Nodo Actualizado' : 'Nodo creado',
          description: 'Tarea lograda con exito.',
        });
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const obtenerNodos = async () => {
    try {
      const response = await axios.get('http://localhost:8000/nodos/');
      const nodos = response.data;
      setNodos(nodos);
    } catch (error) {
      console.error('Error al obtener los nodos:', error);
      setAlert({
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
      <div className="flex flex-col gap-10">
        <TableNodos
          nodos={nodos}
          setNodos={setNodos}
          onEditUptMode={onEditUptMode}
        />
        <div className="Alerta mb-4">
          {alertMsg.message && (
            <Alerts
              type={alertMsg.type}
              message={alertMsg.message}
              description={alertMsg.description}
            />
           )}
        </div>
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
          <AdminMaps onLocationChange={handleLocationChange} nodos={nodos} />
          <div className="mb-5">
            <button
              type="submit"
              className={`w-full cursor-pointer rounded-lg border p-4 text-white transition hover:bg-opacity-90 ${
                isEdit
                  ? 'bg-yellow-500 border-yellow-500'
                  : 'bg-primary border-primary'
              }`}
            >
              {isEdit ? 'Modificar Nodo' : 'Crear Nodo'}
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={toggleEditMode}
                className="mt-2 w-full cursor-pointer rounded-lg border p-4 text-white bg-red-500 hover:bg-red-600"
              >
                Cancelar Modificación
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};
export default PanelNodos;
