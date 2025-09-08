import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UsefulServices.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';

const UsefulServices = () => {
  const navigate = useNavigate();
  
  const services = [
    {
      id: 1,
      icon: faHeart,
      text: 'Рассчитать дату родов',
      color: 'green',
      onClick: () => navigate('/pregnancy-calculator')
    }
  ];

  return (
    <div className="useful-services">
      <h3>Полезные сервисы</h3>
      <div className="services-list">
        {services.map(service => (
          <div 
            key={service.id} 
            className="service-item"
            onClick={service.onClick}
            style={{ cursor: 'pointer' }}
          >
            <div className={`service-icon ${service.color}`}>
              <FontAwesomeIcon icon={service.icon} />
            </div>
            <span>{service.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsefulServices;
