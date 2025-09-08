import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faUser, 
  faMapMarkerAlt, 
  faCalendar,
  faUserPlus,
  faUserMinus
} from '@fortawesome/free-solid-svg-icons';
import './SubscriptionsModal.css';

const SubscriptionsModal = ({ isOpen, onClose, type, userId, onUpdate }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, type, userId]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      if (!token) {
        setError('Необходима авторизация');
        return;
      }

      const endpoint = type === 'followers' ? 'followers' : 'following';
      console.log(`Загружаем ${type} с эндпоинта: /api/users/${endpoint}/`);
      
      const response = await fetch(`http://46.149.70.4/api/users/${endpoint}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Ответ сервера:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Данные от сервера:', data);
        
        const usersList = type === 'followers' ? data.followers : data.following;
        console.log(`${type === 'followers' ? 'Подписчики' : 'Подписки'}:`, usersList);
        setUsers(usersList || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ошибка загрузки данных:', response.status, errorData);
        setError(`Ошибка загрузки данных: ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      const response = await fetch(`http://46.149.70.4/api/users/follow/${targetUserId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Подписка выполнена:', data);
        // Обновляем список пользователей
        fetchUsers();
        // Уведомляем родительский компонент об обновлении
        if (onUpdate) {
          onUpdate();
        }
      } else {
        const errorData = await response.json();
        console.error('Ошибка подписки:', errorData);
      }
    } catch (error) {
      console.error('Ошибка подписки:', error);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      const response = await fetch(`http://46.149.70.4/api/users/unfollow/${targetUserId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Отписка выполнена:', data);
        // Обновляем список пользователей
        fetchUsers();
        // Уведомляем родительский компонент об обновлении
        if (onUpdate) {
          onUpdate();
        }
      } else {
        const errorData = await response.json();
        console.error('Ошибка отписки:', errorData);
      }
    } catch (error) {
      console.error('Ошибка отписки:', error);
    }
  };


  const handleViewNotifications = () => {
    // Переход к странице уведомлений
    window.open('/notifications', '_blank');
  };

  const getAuthorInitials = (authorName) => {
    if (!authorName) return 'А';
    const names = authorName.split(' ');
    return `${names[0]?.charAt(0) || 'А'}${names[1]?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Недавно';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Только что';
    if (diffInHours < 24) return `${diffInHours} ч назад`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU');
  };

  if (!isOpen) return null;

  return (
    <div className="subscriptions-modal-overlay" onClick={onClose}>
      <div className="subscriptions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {type === 'followers' ? 'Подписчики' : 'Подписки'} ({users.length})
          </h2>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Загрузка...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <h3>
                {type === 'followers' ? 'Подписчиков пока нет' : 'Подписок пока нет'}
              </h3>
              <p>
                {type === 'followers' 
                  ? 'Когда на вас подпишутся другие пользователи, они появятся здесь'
                  : 'Когда вы подпишетесь на других пользователей, они появятся здесь'
                }
              </p>
            </div>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="user-item clickable"
                  onClick={() => {
                    console.log('Клик по карточке пользователя в подписках:', user);
                    if (user.id) {
                      console.log('Переходим на профиль пользователя ID:', user.id);
                      navigate(`/user/${user.id}`);
                    } else {
                      console.error('ID пользователя не найден:', user);
                    }
                  }}
                  title="Перейти к профилю"
                >
                  <div 
                    className="user-avatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Клик по аватару пользователя:', user);
                      if (user.id) {
                        navigate(`/user/${user.id}`);
                      }
                    }}
                    title="Перейти к профилю"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.first_name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="user-initials" style={{ 
                      display: user.avatar ? 'none' : 'flex' 
                    }}>
                      {getAuthorInitials(user.first_name || user.username)}
                    </div>
                  </div>
                  
                  <div className="user-info">
                    <div 
                      className="user-name"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Клик по имени пользователя:', user);
                        if (user.id) {
                          navigate(`/user/${user.id}`);
                        }
                      }}
                      title="Перейти к профилю"
                    >
                      {user.first_name || user.username || 'Пользователь'}
                    </div>
                    <div className="user-details">
                      <span className="user-location">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        {user.city || 'Не указан'}
                      </span>
                      <span className="user-join-date">
                        <FontAwesomeIcon icon={faCalendar} />
                        {formatDate(user.date_joined)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="user-actions">
                    {type === 'followers' && (
                      <button 
                        className={user.is_following ? 'unfollow-btn' : 'follow-btn'}
                        onClick={(e) => {
                          e.stopPropagation();
                          user.is_following 
                            ? handleUnfollow(user.id) 
                            : handleFollow(user.id);
                        }}
                        title={user.is_following ? 'Отписаться' : 'Подписаться'}
                      >
                        <FontAwesomeIcon 
                          icon={user.is_following ? faUserMinus : faUserPlus} 
                        />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsModal;
