import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Breadcrumbs.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Breadcrumbs = () => {
  const location = useLocation();
  
  const getCategoryName = (pathname) => {
    const categoryMap = {
      '/category/zachatie': 'Зачатие',
      '/category/eko-mama': 'ЭКО-мама',
      '/category/beremennost': 'Благополучная беременность',
      '/category/vospitanie': 'Воспитание',
      '/category/deti': 'Всё о детях',
      '/category/stati': 'Полезные статьи'
    };
    return categoryMap[pathname] || null;
  };

  const categoryName = getCategoryName(location.pathname);
  
  const breadcrumbs = categoryName 
    ? [
        { text: 'Главная', path: '/', active: false },
        { text: categoryName, path: location.pathname, active: true }
      ]
    : [
        { text: 'Главная', path: '/', active: true }
      ];

  return (
    <div className="breadcrumbs-container">
      <nav className="breadcrumbs">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="breadcrumb-item">
            {index > 0 && (
              <FontAwesomeIcon icon={faChevronRight} className="breadcrumb-separator" />
            )}
            <Link 
              to={crumb.path} 
              className={`breadcrumb-link ${crumb.active ? 'active' : ''}`}
            >
              {crumb.text}
            </Link>
          </span>
        ))}
      </nav>
    </div>
  );
};

export default Breadcrumbs;
