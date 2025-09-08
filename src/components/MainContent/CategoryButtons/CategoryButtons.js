import React from 'react';
import { Link } from 'react-router-dom';
import './CategoryButtons.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faBaby, 
  faChild, 
  faUserFriends,
  faBookOpen
} from '@fortawesome/free-solid-svg-icons';

const CategoryButtons = () => {
  const categories = [
    { icon: faHeart, text: 'Зачатие', path: '/category/zachatie' },
    { icon: faBaby, text: 'ЭКО-мама', path: '/category/eko-mama' },
    { icon: faChild, text: 'Благополучная беременность', path: '/category/beremennost' },
    { icon: faUserFriends, text: 'Воспитание', path: '/category/vospitanie' },
    { icon: faChild, text: 'Всё о детях', path: '/category/deti' },
    { icon: faBookOpen, text: 'Полезные статьи', path: '/category/stati' }
  ];

  return (
    <div className="category-buttons">
      {categories.map((category, index) => (
        <Link key={index} to={category.path} className="category-btn">
          <FontAwesomeIcon icon={category.icon} />
          {category.text}
        </Link>
      ))}
    </div>
  );
};

export default CategoryButtons;
