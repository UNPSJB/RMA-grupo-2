import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmDialog, { ConfirmType } from '../Modal/ConfirmDialog';

interface Sensor {
  id: number;
  tipo: number;
  min: number;
  max: number;
  descripcion: string;
  unidad?: string;
}

interface SensorForm {
  descripcion: string;
  min: number | string;
  max: number | string;
  unidad: string;
}

const TableSensores: React.FC = () => {
  const [sensorsData, setSensorsData] = useState<Sensor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Para manejar la edición
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [editForm, setEditForm] = useState<SensorForm>({
    descripcion: '',
    min: '',
    max: '',
    unidad: ''
  });

  // Para manejar la creación
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<SensorForm>({
    descripcion: '',
    min: '',
    max: '',
    unidad: ''
  });

  // Para manejar la eliminación con ConfirmDialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ConfirmType;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {},
  });

  useEffect(() => {
    obtenerSensores();
  }, []);

  // Efecto para manejar ESC y cerrar modales
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
        handleCancelCreate();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [editingSensor, isCreating]);

  // Auto-ocultar mensajes después de 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const obtenerSensores = async () => {
    try {
      const response = await axios.get('http://localhost:8000/sensores');
      const sortedData = response.data.sort((a: Sensor, b: Sensor) => a.tipo - b.tipo);
      setSensorsData(sortedData);
      setError(null);
    } catch (error) {
      console.error('Error al obtener los sensores:', error);
      setError('Error al cargar los datos.');
    }
  };

  // ========== CREAR SENSOR ==========
  const handleOpenCreate = () => {
    setCreateForm({
      descripcion: '',
      min: '',
      max: '',
      unidad: ''
    });
    setIsCreating(true);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setCreateForm({
      descripcion: '',
      min: '',
      max: '',
      unidad: ''
    });
  };

  const handleSaveCreate = async () => {
    if (!createForm.descripcion || createForm.min === '' || createForm.max === '') {
      setError('Descripción, mínimo y máximo son obligatorios');
      return;
    }

    try {
      const newSensor = {
        descripcion: createForm.descripcion,
        min: parseFloat(createForm.min as string),
        max: parseFloat(createForm.max as string),
        unidad: createForm.unidad || null
      };

      await axios.post('http://localhost:8000/sensor', newSensor);

      setSuccess(`Sensor "${createForm.descripcion}" creado exitosamente!`);
      setIsCreating(false);
      obtenerSensores(); // Recargar lista
    } catch (error: any) {
      console.error('Error al crear el sensor:', error);
      setError(error.response?.data?.detail || 'Error al crear el sensor.');
    }
  };

  // ========== EDITAR SENSOR ==========
  const handleEdit = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setEditForm({
      descripcion: sensor.descripcion,
      min: sensor.min,
      max: sensor.max,
      unidad: sensor.unidad || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingSensor(null);
    setEditForm({
      descripcion: '',
      min: '',
      max: '',
      unidad: ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSensor || editForm.min === '' || editForm.max === '') {
      setError('Mínimo y máximo son obligatorios');
      return;
    }

    try {
      const updatedSensor = {
        descripcion: editForm.descripcion,
        min: parseFloat(editForm.min as string),
        max: parseFloat(editForm.max as string),
        unidad: editForm.unidad || null
      };

      await axios.put(`http://localhost:8000/sensor/${editingSensor.tipo}`, updatedSensor);

      // Actualizar la tabla localmente
      setSensorsData((prevData) =>
        prevData.map((sensor) =>
          sensor.tipo === editingSensor.tipo
            ? { ...sensor, ...updatedSensor }
            : sensor
        )
      );

      setSuccess(`Sensor "${editForm.descripcion}" actualizado exitosamente!`);
      setEditingSensor(null);
    } catch (error: any) {
      console.error('Error al actualizar el sensor:', error);
      setError(error.response?.data?.detail || 'Error al guardar los cambios.');
    }
  };

  // ========== ELIMINAR SENSOR ==========
  const handleDeleteConfirm = (sensor: Sensor) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Sensor',
      message: `¿Estás seguro de que deseas eliminar el sensor "${sensor.descripcion}" (ID: ${sensor.tipo})? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: () => handleDeleteSensor(sensor),
    });
  };

  const handleDeleteSensor = async (sensor: Sensor) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });

    try {
      await axios.delete(`http://localhost:8000/sensor/${sensor.tipo}`);

      setSensorsData((prevData) =>
        prevData.filter((s) => s.tipo !== sensor.tipo)
      );

      setSuccess(`Sensor "${sensor.descripcion}" eliminado exitosamente!`);
    } catch (error: any) {
      console.error('Error al eliminar el sensor:', error);
      setError(error.response?.data?.detail || 'Error al eliminar el sensor.');
    }
  };

  if (sensorsData.length === 0 && !error) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      {/* Header con botón de crear */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Control de Parámetros
        </h4>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary py-3 px-6 text-center font-medium text-white hover:bg-opacity-90"
        >
          <svg
            className="fill-current"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M15 7H9V1C9 0.4 8.6 0 8 0C7.4 0 7 0.4 7 1V7H1C0.4 7 0 7.4 0 8C0 8.6 0.4 9 1 9H7V15C7 15.6 7.4 16 8 16C8.6 16 9 15.6 9 15V9H15C15.6 9 16 8.6 16 8C16 7.4 15.6 7 15 7Z" />
          </svg>
          Crear Sensor Nuevo
        </button>
      </div>

      {/* Mensajes de éxito/error */}
      {success && (
        <div className="mb-4 rounded-sm border border-green-500 bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-sm border border-red-500 bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Tabla */}
      <div className="flex flex-col">
        <div className="grid grid-cols-6 rounded-sm bg-gray-2 dark:bg-meta-4">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Tipo</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Descripción</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Mínimo</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Máximo</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Unidad</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Acciones</h5>
          </div>
        </div>

        {sensorsData.map((sensor) => (
          <div
            className="grid grid-cols-6 border-b border-stroke dark:border-strokedark"
            key={sensor.id}
          >
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white font-medium">{sensor.tipo}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{sensor.descripcion}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{sensor.min}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{sensor.max}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-meta-3 dark:text-white">{sensor.unidad || '-'}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5 gap-2">
              <button
                onClick={() => handleEdit(sensor)}
                className="bg-primary text-white p-2 rounded hover:bg-opacity-90"
                title="Editar sensor"
              >
                <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.8754 11.6719C16.5379 11.6719 16.2285 11.9531 16.2285 12.3187V14.8219C16.2285 15.075 16.0316 15.2719 15.7785 15.2719H2.22227C1.96914 15.2719 1.77227 15.075 1.77227 14.8219V12.3187C1.77227 11.9812 1.49102 11.6719 1.12539 11.6719C0.759766 11.6719 0.478516 11.9531 0.478516 12.3187V14.8219C0.478516 15.7781 1.23789 16.5375 2.19414 16.5375H15.7785C16.7348 16.5375 17.4941 15.7781 17.4941 14.8219V12.3187C17.5223 11.9531 17.241 11.6719 16.8754 11.6719Z" fill=""/>
                  <path d="M8.55074 12.3469C8.66324 12.4594 8.83199 12.5156 9.00074 12.5156C9.16949 12.5156 9.31012 12.4594 9.45074 12.3469L13.4726 8.43752C13.7257 8.1844 13.7257 7.79065 13.5007 7.53752C13.2476 7.2844 12.8539 7.2844 12.6007 7.5094L9.64762 10.4063V2.1094C9.64762 1.7719 9.36637 1.46252 9.00074 1.46252C8.66324 1.46252 8.35387 1.74377 8.35387 2.1094V10.4063L5.40074 7.53752C5.14762 7.2844 4.75387 7.31252 4.50074 7.53752C4.24762 7.79065 4.27574 8.1844 4.50074 8.43752L8.55074 12.3469Z" fill=""/>
                </svg>
              </button>
              <button
                onClick={() => handleDeleteConfirm(sensor)}
                className="bg-red-500 text-white p-2 rounded hover:bg-opacity-90"
                title="Eliminar sensor"
              >
                <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.3125 3.65625H12.375V2.8125C12.375 1.5093 11.3156 0.45 10.0125 0.45H7.9875C6.68438 0.45 5.625 1.5093 5.625 2.8125V3.65625H1.6875C1.40625 3.65625 1.125 3.9375 1.125 4.21875V4.78125C1.125 5.0625 1.40625 5.34375 1.6875 5.34375H2.25V15.1875C2.25 16.4906 3.30937 17.55 4.6125 17.55H13.3875C14.6906 17.55 15.75 16.4906 15.75 15.1875V5.34375H16.3125C16.5938 5.34375 16.875 5.0625 16.875 4.78125V4.21875C16.875 3.9375 16.5938 3.65625 16.3125 3.65625ZM7.03125 2.8125C7.03125 2.25 7.425 1.85625 7.9875 1.85625H10.0125C10.575 1.85625 10.9688 2.25 10.9688 2.8125V3.65625H7.03125V2.8125ZM14.0625 15.1875C14.0625 15.5813 13.7813 15.8625 13.3875 15.8625H4.6125C4.21875 15.8625 3.9375 15.5813 3.9375 15.1875V5.34375H14.0625V15.1875Z" fill=""/>
                  <path d="M8.4375 7.875C8.15625 7.875 7.875 8.15625 7.875 8.4375V13.5C7.875 13.7813 8.15625 14.0625 8.4375 14.0625C8.71875 14.0625 9 13.7813 9 13.5V8.4375C9 8.15625 8.71875 7.875 8.4375 7.875Z" fill=""/>
                  <path d="M10.6875 7.875C10.4063 7.875 10.125 8.15625 10.125 8.4375V13.5C10.125 13.7813 10.4063 14.0625 10.6875 14.0625C10.9688 14.0625 11.25 13.7813 11.25 13.5V8.4375C11.25 8.15625 10.9688 7.875 10.6875 7.875Z" fill=""/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Creación */}
      {isCreating && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-600 bg-opacity-50">
          <div className="bg-white dark:bg-boxdark p-6 rounded-lg shadow-lg w-96 max-w-full">
            <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">Crear Nuevo Sensor</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Descripción *
              </label>
              <input
                type="text"
                value={createForm.descripcion}
                onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
                className="w-full p-2 border rounded dark:bg-meta-4 dark:text-white dark:border-strokedark"
                placeholder="Ej: Conductividad Eléctrica"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Valor Mínimo *
              </label>
              <input
                type="number"
                step="any"
                value={createForm.min}
                onChange={(e) => setCreateForm({ ...createForm, min: e.target.value })}
                className="w-full p-2 border rounded dark:bg-meta-4 dark:text-white dark:border-strokedark"
                placeholder="Ej: 0"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Valor Máximo *
              </label>
              <input
                type="number"
                step="any"
                value={createForm.max}
                onChange={(e) => setCreateForm({ ...createForm, max: e.target.value })}
                className="w-full p-2 border rounded dark:bg-meta-4 dark:text-white dark:border-strokedark"
                placeholder="Ej: 5000"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Unidad de Medida
              </label>
              <input
                type="text"
                value={createForm.unidad}
                onChange={(e) => setCreateForm({ ...createForm, unidad: e.target.value })}
                className="w-full p-2 border rounded dark:bg-meta-4 dark:text-white dark:border-strokedark"
                placeholder="Ej: µS/cm, °C, hPa..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelCreate}
                className="bg-red-400 text-white px-4 py-2 rounded hover:bg-opacity-90"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCreate}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-opacity-90"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editingSensor && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-600 bg-opacity-50">
          <div className="bg-white dark:bg-boxdark p-6 rounded-lg shadow-lg w-96 max-w-full">
            <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Editar Sensor #{editingSensor.tipo}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Descripción *
              </label>
              <input
                type="text"
                value={editForm.descripcion}
                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                className="w-full p-2 border rounded dark:bg-meta-4 dark:text-white dark:border-strokedark"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Valor Mínimo *
              </label>
              <input
                type="number"
                step="any"
                value={editForm.min}
                onChange={(e) => setEditForm({ ...editForm, min: e.target.value })}
                className="w-full p-2 border rounded dark:bg-meta-4 dark:text-white dark:border-strokedark"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Valor Máximo *
              </label>
              <input
                type="number"
                step="any"
                value={editForm.max}
                onChange={(e) => setEditForm({ ...editForm, max: e.target.value })}
                className="w-full p-2 border rounded dark:bg-meta-4 dark:text-white dark:border-strokedark"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                Unidad de Medida
              </label>
              <input
                type="text"
                value={editForm.unidad}
                onChange={(e) => setEditForm({ ...editForm, unidad: e.target.value })}
                className="w-full p-2 border rounded dark:bg-meta-4 dark:text-white dark:border-strokedark"
                placeholder="Opcional"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="bg-red-400 text-white px-4 py-2 rounded hover:bg-opacity-90"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-opacity-90"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default TableSensores;
