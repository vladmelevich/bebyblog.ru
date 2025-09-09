import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCalendar } from '@fortawesome/free-solid-svg-icons';

const SimpleUserData = () => {
  const [userData, setUserData] = useState({
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Получаем данные пользователя из localStorage
        const currentUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        
        if (currentUserData && token) {
          const parsedUserData = JSON.parse(currentUserData);
          console.log('✅ Данные пользователя из localStorage:', parsedUserData);
          
          // Пробуем загрузить данные с сервера
          try {
            const response = await fetch(`http://93.183.80.220/api/users/${parsedUserData.id}/`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            });
            
            if (response.ok) {
              const serverResponse = await response.json();
              console.log('✅ Ответ сервера:', serverResponse);
              
              // Извлекаем данные пользователя из ответа
              const serverData = serverResponse.user || serverResponse;
              console.log('✅ Данные пользователя с сервера:', serverData);
              console.log('✅ Аватар пользователя:', serverData.avatar);
              console.log('✅ Все поля пользователя:', Object.keys(serverData));
              
              setUserData({
                ...parsedUserData,
                ...serverData,
                city: serverData.city || parsedUserData.city || 'Москва',
                date_joined: serverData.date_joined || parsedUserData.date_joined || '2024-01-15T10:30:00Z'
              });
            } else {
              console.error('Ошибка загрузки данных с сервера:', response.status);
              // Используем данные из localStorage
              setUserData({
                ...parsedUserData,
                city: parsedUserData.city || 'Москва',
                date_joined: parsedUserData.date_joined || '2024-01-15T10:30:00Z'
              });
            }
          } catch (error) {
            console.error('Ошибка при загрузке данных с сервера:', error);
            // Используем данные из localStorage
            setUserData({
              ...parsedUserData,
              city: parsedUserData.city || 'Москва',
              date_joined: parsedUserData.date_joined || '2024-01-15T10:30:00Z'
            });
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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

  if (loading) {
    return (
      <div className="user-profile-section">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Загрузка данных пользователя...
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-section">
      <div className="user-avatar">
        {userData.avatar && userData.avatar !== null && userData.avatar !== '' ? (
          <img 
            src={userData.avatar.startsWith('http') ? userData.avatar : `http://93.183.80.220${userData.avatar}`} 
            alt={userData.first_name}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onError={(e) => {
              console.log('Ошибка загрузки аватара:', e.target.src);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
            onLoad={() => {
              console.log('Аватар загружен успешно:', userData.avatar);
            }}
          />
        ) : (
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
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {getAuthorInitials(userData.first_name)}
          </div>
        )}
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
