import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './SmallCards.css';

const SmallCards = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);

  const smallCards = [
    {
      id: 4,
      title: 'Питание малыша: от грудного вскармливания до прикорма',
      color: 'orange',
      illustration: 'baby-feeding'
    },
    {
      id: 5,
      title: 'Игры и развлечения: развивающие занятия для детей',
      color: 'teal',
      illustration: 'baby-games'
    },
    {
      id: 6,
      title: 'Здоровье ребенка: советы педиатра для молодых мам',
      color: 'coral',
      illustration: 'baby-health'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % smallCards.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + smallCards.length) % smallCards.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="small-cards-wrapper">
      <div className="small-cards">
        <div className="slider-container" ref={sliderRef}>
          <div 
            className="slider-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {smallCards.map((card, index) => (
              <div key={card.id} className="slider-slide">
                <Link
                  to={`/post/${card.id}`}
                  className="small-card-link"
                >
                  <div
                    className={`featured-card small-card ${card.color}`}
                    style={{ '--card-index': index }}
                  >
                    <div className="card-content">
                      <h4>{card.title}</h4>
                    </div>
                    <div className="card-image">
                      <div className={`illustration ${card.illustration}`}></div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
        
        {/* Навигационные кнопки */}
        <button className="slider-btn prev-btn" onClick={prevSlide}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button className="slider-btn next-btn" onClick={nextSlide}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
        
        {/* Индикаторы слайдов */}
        <div className="slider-indicators">
          {smallCards.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SmallCards;
