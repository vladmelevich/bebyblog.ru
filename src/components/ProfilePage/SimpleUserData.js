import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCalendar } from '@fortawesome/free-solid-svg-icons';

const SimpleUserData = () => {
  console.log('SimpleUserData: компонент загружен');
  
  // Получаем данные пользователя из localStorage
  const currentUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  let userData = {
    id: 1,
    username: 'Пользователь',
    first_name: 'Пользователь',
    last_name: '',
    email: 'user@example.com',
    avatar: null,
    city: 'Москва',
    date_joined: '2024-01-15T10:30:00Z',
    followers_count: 0,
    following_count: 0,
    posts_count: 0
  };
  
  // Если есть данные пользователя, используем их
  if (currentUserData) {
    try {
      const parsedUserData = JSON.parse(currentUserData);
      userData = {
        ...userData,
        ...parsedUserData,
        city: parsedUserData.city || 'Москва',
        date_joined: parsedUserData.date_joined || '2024-01-15T10:30:00Z'
      };
      console.log('✅ Используем данные пользователя из localStorage:', userData);
    } catch (error) {
      console.error('Ошибка парсинга данных пользователя:', error);
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Недавно';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Только что';
    if (diffInHours < 24) return `${diffInHours} ч. назад`;
    if (diffInHours < 48) return 'Вчера';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} дн. назад`;
    if (diffInHours < 720) return `${Math.floor(diffInHours / 168)} нед. назад`;
    if (diffInHours < 8760) return `${Math.floor(diffInHours / 720)} мес. назад`;
    return `${Math.floor(diffInHours / 8760)} г. назад`;
  };

  const getAuthorInitials = (authorName) => {
    if (!authorName) return 'П';
    const names = authorName.split(' ');
    return `${names[0]?.charAt(0) || 'П'}${names[1]?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="user-profile-section">
      <div className="user-avatar">
        <div className="avatar-placeholder" style={{ 
          display: 'flex',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#8B5CF6',
          color: 'white',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          {getAuthorInitials(userData.first_name)}
        </div>
      </div>
      <div className="user-info">
        <h1 className="user-name">{userData.first_name || userData.username || 'Пользователь'}</h1>
        <div className="user-login">@{userData.username || 'user'}</div>
        <div className="user-details">
          <span className="user-location">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
            {userData.city || 'Не указан'}
          </span>
          <span className="user-join-date">
            <FontAwesomeIcon icon={faCalendar} />
            {userData.date_joined ? formatDate(userData.date_joined) : 'Недавно'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimpleUserData;
