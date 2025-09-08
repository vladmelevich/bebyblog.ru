import React from 'react';
import { Link } from 'react-router-dom';
import './FeaturedCards.css';
import featuredCardsData from '../../../data/featuredCards.json';

const FeaturedCards = () => {
  const largeCards = featuredCardsData.filter(card => card.type === 'large');
  const smallCards = featuredCardsData.filter(card => card.type === 'small');

  return (
    <div className="featured-content-wrapper">
      <div className="featured-content">
        {/* Десктопная версия - 2 ряда */}
        <div className="desktop-layout">
          {/* Верхний ряд - 2 большие карточки */}
          <div className="top-row">
            {largeCards.map(card => (
              <Link key={card.id} to={`/post/${card.id}`} className="featured-card-link large">
                <div className={`featured-card ${card.color}`}>
                  <div className="card-content">
                    <h3>{card.title}</h3>
                  </div>
                  <div className="card-image">
                    <div className={`illustration ${card.illustration}`}></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Нижний ряд - 3 маленькие карточки */}
          <div className="bottom-row">
            {smallCards.map(card => (
              <Link key={card.id} to={`/post/${card.id}`} className="featured-card-link small">
                <div className={`featured-card ${card.color}`}>
                  <div className="card-content">
                    <h3>{card.title}</h3>
                  </div>
                  <div className="card-image">
                    <div className={`illustration ${card.illustration}`}></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Мобильная версия - вертикальный список */}
        <div className="mobile-layout">
          <div className="slider-container">
            <div className="slider-track">
              {featuredCardsData.map(card => (
                <div key={card.id} className="slider-slide">
                  <Link to={`/post/${card.id}`} className="featured-card-link">
                    <div className={`featured-card ${card.color}`}>
                      <div className="card-content">
                        <h3>{card.title}</h3>
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
        </div>
      </div>
    </div>
  );
};

export default FeaturedCards;
