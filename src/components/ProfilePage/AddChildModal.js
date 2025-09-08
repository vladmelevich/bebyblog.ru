import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faBaby, 
  faMars, 
  faVenus,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import './AddChildModal.css';

const AddChildModal = ({ isOpen, onClose, onAddChild }) => {
  const [childData, setChildData] = useState({
    name: '',
    gender: '',
    birthDate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (childData.name && childData.gender && childData.birthDate) {
      onAddChild(childData);
      setChildData({ name: '', gender: '', birthDate: '' });
      onClose();
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age === 0) {
      const monthAge = monthDiff < 0 ? monthDiff + 12 : monthDiff;
      if (monthAge === 0) {
        return "новорожденный";
      } else if (monthAge === 1) {
        return "1 месяц";
      } else if (monthAge >= 2 && monthAge <= 4) {
        return `${monthAge} месяца`;
      } else {
        return `${monthAge} месяцев`;
      }
    } else {
      if (age >= 11 && age <= 19) {
        return `${age} лет`;
      } else {
        const lastDigit = age % 10;
        if (lastDigit === 1) {
          return `${age} год`;
        } else if (lastDigit >= 2 && lastDigit <= 4) {
          return `${age} года`;
        } else {
          return `${age} лет`;
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <FontAwesomeIcon icon={faBaby} />
            Добавить ребенка
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="childName">Имя ребенка</label>
            <input
              type="text"
              id="childName"
              value={childData.name}
              onChange={(e) => setChildData({...childData, name: e.target.value})}
              placeholder="Введите имя ребенка"
              required
            />
          </div>

          <div className="form-group">
            <label>Пол</label>
            <div className="gender-buttons">
              <button
                type="button"
                className={`gender-btn ${childData.gender === 'male' ? 'active' : ''}`}
                onClick={() => setChildData({...childData, gender: 'male'})}
              >
                <FontAwesomeIcon icon={faMars} />
                Мальчик
              </button>
              <button
                type="button"
                className={`gender-btn ${childData.gender === 'female' ? 'active' : ''}`}
                onClick={() => setChildData({...childData, gender: 'female'})}
              >
                <FontAwesomeIcon icon={faVenus} />
                Девочка
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="birthDate">
              <FontAwesomeIcon icon={faCalendarAlt} />
              Дата рождения
            </label>
            <input
              type="date"
              id="birthDate"
              value={childData.birthDate}
              onChange={(e) => setChildData({...childData, birthDate: e.target.value})}
              required
            />
            {childData.birthDate && (
              <div className="age-preview">
                Возраст: {calculateAge(childData.birthDate)}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-save">
              Добавить ребенка
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChildModal;
