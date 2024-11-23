import React from 'react';

interface AlerMensaje {
  message: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void; // Asegúrate de que se pase correctamente la función
}

const AlertMensaje: React.FC<AlerMensaje> = ({ message, description, onClose, onConfirm }) => {
  return (
    <div className="alert-popup-overlay">
      <div className="alert-popup-box">
        <div className="alert-popup-header">{message}</div>
        <div className="alert-popup-description">{description}</div>
      </div>
    </div>
  );
};

export default AlertMensaje;
