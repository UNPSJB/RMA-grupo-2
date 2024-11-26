import React from 'react';

interface AlertPopupProps {
  message: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
}

const AlertPopup: React.FC<AlertPopupProps> = ({ message, description, onClose, onConfirm }) => {
  return (
    <div className="alert-popup-overlay">
      <div className="alert-popup-box">
        <div className="alert-popup-header">{message}</div>
        <div className="alert-popup-description">{description}</div>
        <div className="alert-popup-buttons">
          <button className="alert-popup-button text-white bg-green-500 hover:bg-green-600" onClick={onConfirm}>Confirmar</button>
          <button className="alert-popup-button dedbg-red-500 text-white px-4 py-2 roun" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};
export default AlertPopup;
