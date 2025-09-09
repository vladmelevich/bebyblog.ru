import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPen, 
  faUser, 
  faUsers, 
  faSignOutAlt, 
  faChevronDown, 
  faChevronRight, 
  faMoon, 
  faUserFriends
} from '@fortawesome/free-solid-svg-icons';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuthStatus();
    window.addEventListener('authUpdate', checkAuthStatus);
    return () => window.removeEventListener('authUpdate', checkAuthStatus);
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    
    let user = null;
    if (userDataString) {
      try {
        user = JSON.parse(userDataString);
      } catch (error) {
        console.error('Ошибка парсинга userData:', error);
      }
    }
    
    // Проверяем, есть ли токен и данные пользователя
    const isAuthenticated = !!token && !!user;
    setIsLoggedIn(isAuthenticated);
    setUserData(user);
    
    // Если токен есть, но данных пользователя нет, очищаем токены
    if (token && !user) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      setUserData(null);
    }
  };

  const handleWritePostClick = () => {
    if (!isLoggedIn) {
      setShowWriteModal(true);
    } else {
      navigate('/create-post');
    }
  };

  const handleLogout = () => {
    // Очищаем все данные из localStorage и sessionStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userData');
    
    setIsLoggedIn(false);
    setUserData(null);
    setShowDropdown(false);
    
    // Обновляем состояние авторизации
    window.dispatchEvent(new CustomEvent('authUpdate'));
    
    navigate('/');
  };


  const handleProfileClick = () => {
    // Всегда переходим на собственный профиль
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      navigate('/profile');
    } else {
      navigate('/auth');
    }
    setShowDropdown(false);
  };

  const handleChatsClick = () => {
    navigate('/chats');
    setShowDropdown(false);
  };

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme);
    // Здесь можно добавить логику для переключения темы
    document.body.classList.toggle('dark-theme');
    setShowDropdown(false);
  };


  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/posts?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };



  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo" onClick={() => navigate('/')}>
            <h1>BebyBlog</h1>
          </div>
        </div>

        <div className="header-center">
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Поиск постов..." 
              className="search-input"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyPress={handleSearch}
            />
          </div>
        </div>

        <div className="header-right">
          <div className="header-actions">
            <button className="btn-write" onClick={handleWritePostClick}>
              <FontAwesomeIcon icon={faPen} />
              Написать пост
            </button>
            
            {isLoggedIn ? (
              <div className="user-menu">
                <div 
                  className="user-profile"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span>{userData?.first_name || userData?.username}</span>
                  <FontAwesomeIcon icon={faChevronDown} className="dropdown-arrow" />
                </div>

                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-user-info">
                        <div className="dropdown-user-details">
                          <div className="dropdown-user-name">
                            {userData?.first_name || userData?.username}
                          </div>
                          <div className="dropdown-user-email">
                            {userData?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="dropdown-items">
                      <div className="dropdown-item" onClick={handleProfileClick}>
                        <FontAwesomeIcon icon={faUser} />
                        <span>Профиль</span>
                        <FontAwesomeIcon icon={faChevronRight} className="item-arrow" />
                      </div>
                      
                      <div className="dropdown-item" onClick={() => { navigate('/friends'); setShowDropdown(false); }}>
                        <FontAwesomeIcon icon={faUsers} />
                        <span>Друзья</span>
                        <FontAwesomeIcon icon={faChevronRight} className="item-arrow" />
                      </div>

                      <div className="dropdown-item" onClick={handleChatsClick}>
                        <FontAwesomeIcon icon={faUserFriends} />
                        <span>Чаты</span>
                        <FontAwesomeIcon icon={faChevronRight} className="item-arrow" />
                      </div>

                      <div className="dropdown-divider"></div>

                      <div className="dropdown-item" onClick={handleThemeToggle}>
                        <FontAwesomeIcon icon={faMoon} />
                        <span>{isDarkTheme ? 'Светлая тема' : 'Темная тема'}</span>
                      </div>

                      <div className="dropdown-divider"></div>

                      <div className="dropdown-item" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        <span>Выйти</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn-login" onClick={() => navigate('/auth')}>
                Войти
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно для неавторизованных пользователей */}
      {showWriteModal && (
        <div className="modal-overlay" onClick={() => setShowWriteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Требуется авторизация</h3>
            <p>Для создания постов необходимо войти в систему</p>
            <div className="modal-actions">
              <button 
                className="btn-primary" 
                onClick={() => { setShowWriteModal(false); navigate('/auth'); }}
              >
                Войти
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowWriteModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
