import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Sensor {
  id: number;
  tipo: number;
  min: number;
  max: number;
  descripcion: string;
}

const TableSensores: React.FC = () => {
  const [sensorsData, setSensorsData] = useState<Sensor[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Para manejar la edición
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [newMin, setNewMin] = useState<number | null>(null);
  const [newMax, setNewMax] = useState<number | null>(null);

  useEffect(() => {
    const obtenerSensores = async () => {
      try {
        const response = await axios.get('http://localhost:8000/sensores');
        
        // Ordenar los datos de menor a mayor por tipo
        const sortedData = response.data.sort((a: Sensor, b: Sensor) => a.tipo - b.tipo);
        
        setSensorsData(sortedData);
      } catch (error) {
        console.error('Error al obtener los sensores:', error);
        setError('Error al cargar los datos.');
      }
    };

    obtenerSensores();
  }, []);

  // Abrir el modal de edición
  const handleEdit = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setNewMin(sensor.min);
    setNewMax(sensor.max);
  };

  // Manejar cambios en los valores 'min' y 'max'
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMin(parseFloat(e.target.value));
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMax(parseFloat(e.target.value));
  };

  // Guardar los cambios
  const handleSave = async () => {
    if (editingSensor && newMin !== null && newMax !== null) {
      try {
        const updatedSensor = {
          min: newMin,
          max: newMax,
        };
        
        // Enviar actualización al servidor
        await axios.put(`http://localhost:8000/sensor/${editingSensor.tipo}`, updatedSensor);

        // Actualizar la tabla con los nuevos valores
        setSensorsData((prevData) =>
          prevData.map((sensor) =>
            sensor.tipo === editingSensor.tipo
              ? { ...sensor, min: newMin, max: newMax }
              : sensor
          )
        );
        setEditingSensor(null); // Cerrar el modal después de guardar
      } catch (error) {
        console.error('Error al actualizar el sensor:', error);
        setError('Error al guardar los cambios.');
      }
    }
  };

  // Cerrar el modal sin guardar cambios
  const handleCancel = () => {
    setEditingSensor(null);
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (sensorsData.length === 0) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
      Control de Parámetros 
      </h4>

      <div className="flex flex-col">
        <div className="grid grid-cols-4 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Tipo</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Mínimo</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Máximo</h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Descripción</h5>
          </div>
        </div>

        {sensorsData.map((sensor) => (
          <div
            className="grid grid-cols-4 sm:grid-cols-4 border-b border-stroke dark:border-strokedark"
            key={sensor.id}
          >
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{sensor.tipo}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{sensor.min}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{sensor.max}</p>
            </div>
            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">{sensor.descripcion}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5 gap-2">
            <button
                onClick={() => handleEdit(sensor)}
                className="bg-blue-500 text-white p-1 rounded"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de edición */}
      {editingSensor && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Editar Sensor</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium">Valor Mínimo</label>
              <input
                type="number"
                value={newMin ?? ''}
                onChange={handleMinChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Valor Máximo</label>
              <input
                type="number"
                value={newMax ?? ''}
                onChange={handleMaxChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSensores;
