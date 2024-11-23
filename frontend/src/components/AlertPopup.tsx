import React from 'react';

interface AlertPopupProps {
  message: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void; // Asegúrate de que se pase correctamente la función
}

const AlertPopup: React.FC<AlertPopupProps> = ({ message, description, onClose, onConfirm }) => {
  return (
    <div className="alert-popup-overlay">
      <div className="alert-popup-box">
        <div className="alert-popup-header">{message}</div>
        <div className="alert-popup-description">{description}</div>
        <div className="alert-popup-buttons">
          <button className="alert-popup-button" onClick={onConfirm}>Confirmar</button>
          <button className="alert-popup-button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default AlertPopup;
