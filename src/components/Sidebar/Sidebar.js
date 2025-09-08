import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome,
  faUser, 
  faBaby, 
  faChild, 
  faBook,
  faBookmark,
  faBars,
  faTimes,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { icon: faHome, text: 'Главная', path: '/' },
    { icon: faUser, text: 'Зачатие', path: '/category/zachatie' },
    { icon: faBaby, text: 'Беременность', path: '/category/beremennost' },
    { icon: faChild, text: 'Всё о детях', path: '/category/deti' },
    { icon: faBook, text: 'Полезные статьи', path: '/category/stati' },
    { icon: faUsers, text: 'Друзья', path: '/friends' },
    { icon: faBookmark, text: 'Архив', path: '/archive' }
  ];

  const handleAboutClick = (e) => {
    e.preventDefault();
    setShowAboutModal(true);
  };

  const handleSupportClick = (e) => {
    e.preventDefault();
    setShowSupportModal(true);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Бургер-меню для мобильных устройств */}
      <div className="mobile-menu-toggle">
        <button className="burger-btn" onClick={toggleMobileMenu}>
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
        </button>
      </div>

      {/* Мобильное меню */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
        <div className="mobile-menu-content">
          <div className="mobile-menu-header">
            <h3>Меню</h3>
            <button className="mobile-menu-close" onClick={closeMobileMenu}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <nav className="mobile-nav">
            <ul>
              {navigationItems.map((item, index) => (
                <li key={index}>
                  <Link to={item.path} onClick={closeMobileMenu}>
                    <FontAwesomeIcon icon={item.icon} />
                    {item.text}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="mobile-menu-footer">
            <a href="#" onClick={(e) => { handleAboutClick(e); closeMobileMenu(); }}>О сайте</a>
            <a href="#" onClick={(e) => { handleSupportClick(e); closeMobileMenu(); }}>Техническая поддержка</a>
          </div>
        </div>
      </div>

      {/* Десктопный сайдбар */}
      <aside className="sidebar">
        <nav className="main-nav">
          <ul>
            {navigationItems.map((item, index) => (
              <li key={index}>
                <Link to={item.path}>
                  <FontAwesomeIcon icon={item.icon} />
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <a href="#" onClick={handleAboutClick}>О сайте</a>
          <a href="#" onClick={handleSupportClick}>Техническая поддержка</a>
        </div>
      </aside>

      {/* Модальные окна остаются без изменений */}
      {showAboutModal && (
        <div className="modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>О сайте</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowAboutModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>BebyBlog</strong> — это современная платформа для мам, где вы можете найти:
              </p>
              <ul>
                <li>Полезные статьи о беременности и воспитании детей</li>
                <li>Советы от опытных мам и специалистов</li>
                <li>Возможность общаться с другими мамами</li>
                <li>Календари беременности и развития ребенка</li>
                <li>Информацию о планировании семьи</li>
              </ul>
              <p>
                Наша миссия — поддержать каждую маму на пути материнства, предоставив 
                качественную информацию и создав дружелюбное сообщество.
              </p>
            </div>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div className="modal-overlay" onClick={() => setShowSupportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Техническая поддержка</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowSupportModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                По всем вопросам технической поддержки обращайтесь на почту:
              </p>
              <div className="support-email">
                <strong>molyan@bk.ru</strong>
              </div>
              <p>
                Мы постараемся ответить на ваши вопросы в кратчайшие сроки.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
