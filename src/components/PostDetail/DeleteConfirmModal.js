import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, postTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <div className="delete-modal-icon">
            <FontAwesomeIcon icon={faTrash} />
          </div>
          <button className="delete-modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="delete-modal-content">
          <h2 className="delete-modal-title">Удалить пост?</h2>
          <p className="delete-modal-message">
            Вы действительно хотите удалить пост <strong>"{postTitle}"</strong>?
          </p>
          <p className="delete-modal-warning">
            Это действие нельзя отменить. Пост будет удален навсегда.
          </p>
        </div>
        
        <div className="delete-modal-actions">
          <button className="delete-modal-btn cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button className="delete-modal-btn confirm-btn" onClick={onConfirm}>
            <FontAwesomeIcon icon={faTrash} />
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
















