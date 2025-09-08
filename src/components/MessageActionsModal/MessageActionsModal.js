import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import './MessageActionsModal.css';

const MessageActionsModal = ({ 
  isOpen, 
  onClose, 
  message, 
  onEdit, 
  onDelete, 
  isMyMessage 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message?.content || '');

  if (!isOpen || !message) {
    return null;
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.content) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
    onClose();
  };

  const handleCancelEdit = () => {
    setEditText(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(message.id);
    onClose();
  };

  return (
    <div className="message-actions-modal-overlay" onClick={onClose}>
      <div className="message-actions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Действия с сообщением</h3>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-content">
          {isEditing ? (
            <div className="edit-section">
              <h4>Редактировать сообщение:</h4>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="edit-textarea"
                rows="3"
                placeholder="Введите новый текст сообщения..."
              />
              <div className="edit-actions">
                <button 
                  className="save-button"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() || editText === message.content}
                >
                  Сохранить
                </button>
                <button 
                  className="cancel-button"
                  onClick={handleCancelEdit}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="actions-section">
              <div className="message-preview">
                <p><strong>Сообщение:</strong></p>
                <p className="message-text">"{message.content}"</p>
                <p className="message-time">
                  {new Date(message.created_at).toLocaleString('ru-RU')}
                </p>
              </div>

              <div className="action-buttons">
                <button 
                  className="action-button edit-button"
                  onClick={handleEdit}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  <span>Редактировать</span>
                </button>

                {isMyMessage && (
                  <button 
                    className="action-button delete-button"
                    onClick={handleDelete}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Удалить</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageActionsModal;
