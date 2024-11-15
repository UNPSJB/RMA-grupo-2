import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import TableAlarmas from '../../components/Tables/TableAlarmas';
import Alerts from '../../components/alerts'
import React, { useEffect, useState } from 'react';

import axios from 'axios';

interface Alarma {
  id: number;
  nombre: string;
  descripcion: string;  
  tipo: number;
  nodo: number;
  valor_min: number;
  valor_max: number;
}

const PanelAlarmas = () => {
  const [alertMsg, setAlert] = useState({
    type: '',
    message: '',
    description: '',
  });
  const [isEdit, setIsEdit] = useState(false);
  const [alarmas, setAlarmas] = useState<Alarma[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    descripcion: '',   
    tipo: '',
    nodo: '',
    valor_min: '',
    valor_max: '' 
  });
  const onEditUptMode = (alarma: Alarma) => {
    setFormData({
      id: alarma.id.toString(),
      nombre: alarma.nombre,
      descripcion: alarma.descripcion,
      tipo: alarma.tipo.toString(),
      nodo: alarma.nodo.toString(),
      valor_min: alarma.valor_min.toString(),
      valor_max: alarma.valor_max.toString()
    });
    setIsEdit(true);
  };

  const toggleEditMode = () => {
    setIsEdit(false);
    setFormData({
      id: '',
      nombre: '',
      descripcion: '',   
      tipo: '',
      nodo: '',
      valor_min: '',
      valor_max: '' 
    });
  };

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = {
      id: formData.id,
      nombre: formData.nombre,
      descripcion: formData.descripcion,  
      tipo: formData.tipo,
      nodo: formData.nodo,
      valor_min: formData.valor_min,
      valor_max: formData.valor_max  
    };

    if (!formData.id || !formData.nombre || !formData.descripcion || !formData.tipo || !formData.nodo || !formData.valor_min || !formData.valor_max) {
      setAlert({
        type: 'warning',
        message: 'Atencion!',
        description: 'Debe rellenar todos los campos.',
      });
      return;
    }
    
    try {
      const url = isEdit
        ? `http://localhost:8000/alarma/${data.id}`
        : 'http://localhost:8000/alarma';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newAlarma = await response.json();
        setFormData({
          id: '',
          nombre: '',
          descripcion: '',   
          tipo: '',
          nodo: '',
          valor_min: '',
          valor_max: '' 
        });
        setIsEdit(false);
        obtenerAlarmas();
        setAlarmas((prevAlarmas) => [...prevAlarmas, newAlarma]);
        toggleEditMode();
        setAlert({
          type: 'success',
          message: isEdit ? 'Alarma Actualizada' : 'Alarma creada',
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

  const obtenerAlarmas = async () => {
    try {
      const response = await axios.get('http://localhost:8000/alarmas/');
      const alarmas = response.data;
      setAlarmas(alarmas);
    } catch (error) {
    console.error('Error al obtener las alarmas:', error);
    setAlert({
      type: 'error',
      message: 'Error',
      description: 'No se pudieron obtener las alarmas, contacte con un administrador.',
    });
    }
  };
  
  useEffect(() => {
    obtenerAlarmas();
  }, []);

  return (
    <>
      <Breadcrumb pageName="Alarmas" />
      <div className="flex flex-col gap-10">
        <TableAlarmas
          alarmas={alarmas}
          setAlarmas={setAlarmas}
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
                placeholder="Ingrese el nombre de la alarma"
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
              Descripcion
            </label>
            <div className="relative">
              <input
                type="string"
                id="descripcion"
                name="descripcion"
                placeholder="Ingrese la descripcion de la alarma"
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
          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Tipo de dato
            </label>
            <div className="relative">
              <input
                type="string"
                name="tipo"
                id="tripo"
                placeholder="Ingrese el tipo de dato del sensor"
                className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value })
                }
                value={formData.tipo}
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
              Nodo
            </label>
            <div className="relative">
              <input
                type="string"
                id="nodo"
                name="nodo"
                placeholder="Ingrese el numero de nodo a revisar"
                onChange={(e) =>
                  setFormData({ ...formData, nodo: e.target.value })
                }
                value={formData.nodo}
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
              Valor Minimo
            </label>
            <div className="relative">
              <input
                type="number"
                id="valor_min"
                name="valor_min"
                placeholder="Ingrese el valor minimo a revisar"
                onChange={(e) =>
                  setFormData({ ...formData, valor_min: e.target.value })
                }
                value={formData.valor_min}
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
              Valor Maximo
            </label>
            <div className="relative">
              <input
                type="number"
                id="valor_max"
                name="valor_max"
                placeholder="Ingrese el valor maximo a revisar"
                onChange={(e) =>
                  setFormData({ ...formData, valor_max: e.target.value })
                }
                value={formData.valor_max}
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
          <div className="mb-5">
            <button
              type="submit"
              className={`w-full cursor-pointer rounded-lg border p-4 text-white transition hover:bg-opacity-90 ${
                isEdit
                  ? 'bg-yellow-500 border-yellow-500'
                  : 'bg-primary border-primary'
              }`}
            >
              {isEdit ? 'Modificar Alarma' : 'Crear Alarma'}
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
export default PanelAlarmas;
