// components/AlertPanelNodos.tsx
import React from 'react';

interface AlertPanelProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  description?: string;
  onClose?: () => void;
}

const AlertPanelNodos: React.FC<AlertPanelProps> = ({ type, message, description, onClose }) => {
  const alertColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 p-4 text-white shadow-lg transition-transform transform ${
        alertColors[type]
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <p className="font-bold">{message}</p>
          {description && <p className="text-sm">{description}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-lg font-bold focus:outline-none"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};
export default AlertPanelNodos;
