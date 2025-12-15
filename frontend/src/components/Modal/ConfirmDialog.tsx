import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faTrash,
  faUnlink
} from '@fortawesome/free-solid-svg-icons';
import './ConfirmDialog.css';

export type ConfirmType = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  onConfirm,
  onCancel,
}) => {
  // Efecto para manejar ESC y cerrar el diálogo
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return faTrash;
      case 'warning':
        return faExclamationTriangle;
      case 'info':
        return faUnlink;
      default:
        return faExclamationTriangle;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'danger':
        return 'confirm-dialog-danger';
      case 'warning':
        return 'confirm-dialog-warning';
      case 'info':
        return 'confirm-dialog-info';
      default:
        return 'confirm-dialog-warning';
    }
  };

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div
        className={`confirm-dialog ${getColorClasses()}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog-icon">
          <FontAwesomeIcon icon={getIcon()} size="3x" />
        </div>
        <h2 className="confirm-dialog-title">{title}</h2>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button
            onClick={onCancel}
            className="confirm-dialog-btn confirm-dialog-btn-cancel"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="confirm-dialog-btn confirm-dialog-btn-confirm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
