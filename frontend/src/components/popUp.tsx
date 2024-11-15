import React from 'react';

interface AlertPopupProps {
  message: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
}

const AlertPopup: React.FC<AlertPopupProps> = ({ message, description, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-xl font-semibold">{message}</h3>
        <p className="mt-2">{description}</p>
        <div className="mt-4 flex justify-end gap-3">
          {/* Botón de Cerrar */}
          <button
            onClick={onClose}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Cerrar
          </button>
          {/* Botón de Eliminar */}
          <button
            onClick={onConfirm}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertPopup;
