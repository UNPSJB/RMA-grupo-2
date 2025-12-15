import React, { useEffect } from 'react';

interface AlertPopupProps {
  message: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
}

const AlertPopup: React.FC<AlertPopupProps> = ({ message, description, onClose, onConfirm }) => {
  // Efecto para manejar ESC y cerrar el popup
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

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
