
import React, { useState } from 'react';
import AlertPopup from '../../components/AlertPopup'

interface Alarma {
  id: number;
  nombre: string;
  descripcion: string;  
  tipo: number;
  nodo: number;
  valor_min: number;
  valor_max: number;
  chat_id: number | null;
}

interface TableAlarmaProps {
  alarmas: Alarma[];
  setAlarmas: (alarmas: Alarma[]) => void;
  onEditUptMode: (alarma: Alarma) => void;
}

const TableAlarmas: React.FC<TableAlarmaProps> = ({ alarmas, setAlarmas, onEditUptMode }) => {
  const [alert, setPopUp] = useState<{ message: string; description: string } | null>(null);
  const [selectedAlarma, setSelectedAlarma] = useState<Alarma | null>(null);

  const showAlert = (alarma: Alarma) => {
    setSelectedAlarma(alarma);
    setPopUp({
      message: 'Atención!',
      description: 'La eliminación de la alarma es permanente.',
    });
  };

  const deleteAlarma = async () => {
    if (!selectedAlarma) return;
    try {
      const response = await fetch(`http://localhost:8000/alarma/${selectedAlarma.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id:selectedAlarma.id })
      });

      if (response.ok) {
        setAlarmas(alarmas.filter((alarma) => alarma.id !== selectedAlarma.id));
        console.log('Alarma eliminada:', selectedAlarma);
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setPopUp(null);
  };

  if (alarmas.length === 0) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Lista de alarmas
      </h4>
      
      {}
      <div className="Alerta mb-4">
        {alert && (
          <AlertPopup
            message={alert.message}
            description={alert.description}
            onClose={() => setPopUp(null)}
            onConfirm={deleteAlarma}
          />
        )}
      </div>
      <div className="flex flex-col" style={{ maxHeight: '400px', overflowY: 'scroll' }}>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-1 rounded-sm bg-gray-2 dark:bg-meta-4 sticky top-0 z-10">
          <div className="p-1 xl:p-2">
            <h5 className="text-xs font-medium uppercase">Nombre</h5>
          </div>
          <div className="p-1 text-left xl:p-2">
            <h5 className="text-xs font-medium uppercase">Descripcion</h5>
          </div>
          <div className="p-1 text-center xl:p-2">
            <h5 className="text-xs font-medium uppercase">Tipo de dato</h5>
          </div>
          <div className="p-1 text-center xl:p-2">
            <h5 className="text-xs font-medium uppercase">Nodo</h5>
          </div>
          <div className="p-1 text-center xl:p-2">
            <h5 className="text-xs font-medium uppercase">Valor Minimo</h5>
          </div>
          <div className="p-1 text-center xl:p-2">
            <h5 className="text-xs font-medium uppercase">Valor Maximo</h5>
          </div>
          <div className="p-1 text-center xl:p-2">
            <h5 className="text-xs font-medium uppercase">Grupal/Personal</h5>
          </div>
        </div>
        {alarmas.map((alarma) => (
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1 border-b border-stroke dark:border-strokedark" key={alarma.id}>
            <div className="flex items-center gap-1 p-1 xl:p-2">
              <p className="text-black dark:text-white">{alarma.nombre}</p>
            </div>
            <div className="flex items-center gap-1 p-1 xl:p-2">
              <p className="text-black dark:text-white">{alarma.descripcion}</p>
            </div>
            <div className="flex items-center justify-center gap-1 p-1 xl:p-2">
              <p className="text-black dark:text-white">{alarma.tipo}</p>
            </div>
            <div className="flex items-center justify-center gap-1 p-1 xl:p-2">
              <p className="text-black dark:text-white">{alarma.nodo}</p>
            </div>
            <div className="flex items-center justify-center gap-1 p-1 xl:p-2">
              <p className="text-black dark:text-white">{alarma.valor_min}</p>
            </div>
            <div className="flex items-center justify-center gap-1 p-1 xl:p-2">
              <p className="text-black dark:text-white">{alarma.valor_max}</p>
            </div>
            <div className="flex items-center justify-center gap-1 p-1 xl:p-2">
              <p className="text-black dark:text-white">
                {alarma.chat_id === null ? 'Grupal' : 'Personal'}
              </p>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5 space-x-5">
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={() => onEditUptMode(alarma)}
              >
                Editar
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => showAlert(alarma)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableAlarmas;
