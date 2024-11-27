import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import TableAlarmas from '../../components/Tables/TableAlarmas';
import Alerts from '../../components/alerts';
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
  chat_id: string;
}

const PanelAlarmas = () => {
  const [alertMsg, setAlert] = useState({
    type: '',
    message: '',
    description: '',
  });
  const [isEdit, setIsEdit] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [alarmas, setAlarmas] = useState<Alarma[]>([]);
  const [showTable, setShowTable] = useState(true);
  const [nodos, setNodos] = useState<number[]>([]);
  const [tiposSensores, setTiposSensores] = useState<string[]>([]);
  const [isLinked, setIsLinked] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    descripcion: '',   
    tipo: '',
    nodo: '',
    valor_min: '',
    valor_max: '',
    chat_id: ''
  });

  const onEditUptMode = (alarma: Alarma) => {
    setFormData({
      id: alarma.id != null ? alarma.id.toString() : '',
      nombre: alarma.nombre,
      descripcion: alarma.descripcion,
      tipo: alarma.tipo.toString(),
      nodo: alarma.nodo.toString(),
      valor_min: alarma.valor_min.toString(),
      valor_max: alarma.valor_max.toString(),
      chat_id: alarma.chat_id != null ? alarma.chat_id.toString() : ''
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
      valor_max: '',
      chat_id: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const { id, nombre, descripcion, tipo, nodo, valor_min, valor_max } = formData;
  
    const data = {
      id: id ? parseInt(id, 10) : null,
      nombre,
      descripcion,
      tipo: parseInt(tipo, 10),
      nodo: parseInt(nodo, 10),
      valor_min: parseFloat(valor_min),
      valor_max: parseFloat(valor_max),
      chat_id: formData.chat_id || null
    };
    console.log("Datos enviados:", data);
    if (!nombre || !descripcion || !tipo || !nodo || !valor_min || !valor_max) {
      setAlert({
        type: 'warning',
        message: 'Atencion!',
        description: 'Debe rellenar todos los campos.',
      });
      return;
    }
  
    try {
      const url = isEdit
        ? `http://localhost:8000/alarma/${id}`
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
          valor_max: '',
          chat_id: ''
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

  const obtenerNodos = async () => {
    try {
      const response = await axios.get('http://localhost:8000/lista_nodos');
      const nodosData = response.data;
      const nodosExtraidos = nodosData.map((nodo: { value: number; label: string }) => ({
        id: nodo.value,
        nombre: nodo.label,
      }));
      setNodos(nodosExtraidos);
    } catch (error) {
      console.error('Error al obtener nodos:', error);
    }
  };
  
  const obtenerTiposSensores = async () => {
    try {
      const response = await axios.get('http://localhost:8000/sensores');
      const sensoresData = response.data;
      const sensoresExtraidos = sensoresData.map((sensor: { tipo: number; descripcion: string }) => ({
        tipo: sensor.tipo,
        desc: sensor.descripcion,
      }));
      setTiposSensores(sensoresExtraidos);
    } catch (error) {
      console.error('Error al obtener tipos de sensores:', error);
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

  const verificarVinculacion = async () => {
    const userId = localStorage.getItem('id');
    console.log("User ID desde localStorage:", userId);
    if (userId) {
      try {
        const response = await axios.get(`http://localhost:8000/verificar-vinculacion?user_id=${userId}`);
        setChatId(response.data.chat_id);
        setIsLinked(response.data.status);
      } catch (error) {
        console.error('Error al verificar vinculación:', error);
      }
    }
  };
  useEffect(() => {
    obtenerNodos();
    obtenerTiposSensores();
    obtenerAlarmas();
    verificarVinculacion();
  }, []);

  return (
    <>
      <Breadcrumb pageName="Alarmas" />
      <div className="flex flex-col gap-10">
        <button
          className="mb-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          onClick={() => setShowTable(!showTable)}
        >
          {showTable ? 'Ocultar Tabla' : 'Mostrar Tabla'}
        </button>
      </div>
      <div className="flex flex-col gap-10">
        {showTable && (
          <TableAlarmas
            alarmas={alarmas}
            setAlarmas={setAlarmas}
            onEditUptMode={onEditUptMode}
          />
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Nombre
            </label>
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
          </div>
          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Descripcion
            </label>
            <input
              type="text"
              id="descripcion"
              name="descripcion"
              placeholder="Ingrese la descripcion de la alarma"
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              value={formData.descripcion}
              className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Tipo de Medicion
            </label>
            <select
              name="tipo"
              id="tipo"
              value={formData.tipo}
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
              className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="" disabled>
                Seleccione el tipo de dato
              </option>
              {tiposSensores.map((sensor, index) => (
                <option key={index} value={sensor.tipo}>{sensor.desc}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Nodo
            </label>
            <select
              id="nodo"
              name="nodo"
              value={formData.nodo}
              onChange={(e) =>
                setFormData({ ...formData, nodo: e.target.value })
              }
              className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="" disabled>
                Seleccione un nodo
              </option>
              {nodos.map((nodo, index) => (
                <option key={index} value={nodo.id}>
                  {nodo.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Valor Mínimo
            </label>
            <input
              type="number"
              id="valor_min"
              name="valor_min"
              placeholder="Valor mínimo"
              onChange={(e) =>
                setFormData({ ...formData, valor_min: e.target.value })
              }
              value={formData.valor_min}
              className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Valor Máximo
            </label>
            <input
              type="number"
              id="valor_max"
              name="valor_max"
              placeholder="Valor máximo"
              onChange={(e) =>
                setFormData({ ...formData, valor_max: e.target.value })
              }
              value={formData.valor_max}
              className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Enviar mensaje a
            </label>
            <select
              value={formData.chat_id}
              onChange={(e) => setFormData({ ...formData, chat_id: e.target.value })}
              className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="grupal">Chat grupal</option>
              {isLinked && <option value={chatId}>Telegram personal</option>}
            </select>
          </div>
          <button
            type="submit"
            className={`w-full cursor-pointer rounded-lg border p-4 text-white transition hover:bg-opacity-90 ${
              isEdit ? 'bg-yellow-500 border-yellow-500' : 'bg-primary border-primary'
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
          <div className="Alerta mt-4">
          {alertMsg.message && (
            <Alerts
              type={alertMsg.type}
              message={alertMsg.message}
              description={alertMsg.description}
            />
          )}
        </div>
        </form>
      </div>
    </>
  );
};

export default PanelAlarmas;