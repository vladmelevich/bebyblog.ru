import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faMapMarkerAlt,
  faCalendar,
  faUserPlus,
  faUserMinus,
  faSearch,
  faUsers,
  faUserFriends,
  faBell,
  faCheck,
  faTimes,
  faMessage,
  faHeart,
  faComment
} from '@fortawesome/free-solid-svg-icons';
import ChatModal from '../ChatModal/ChatModal';
import { makeAuthenticatedRequest } from '../../utils/auth';
import './FriendsPage.css';

const FriendsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const isLoggedIn = () => {
    return !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'));
  };

  // Мемоизируем количество непрочитанных уведомлений
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);


  // Загрузка уведомлений
  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const response = await makeAuthenticatedRequest('http://93.183.80.220/api/users/notifications/');
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        console.error('Ошибка загрузки уведомлений');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Отметить уведомление как прочитанное
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const response = await makeAuthenticatedRequest(
        `http://93.183.80.220/api/users/notifications/${notificationId}/read/`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        // Обновляем список уведомлений
        fetchNotifications();
      }
    } catch (error) {
      console.error('Ошибка отметки уведомления:', error);
    }
  }, [fetchNotifications]);

  // Отметить все уведомления как прочитанные
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest(
        'http://93.183.80.220/api/users/notifications/mark-all-read/',
        { method: 'POST' }
      );
      
      if (response.ok) {
        // Обновляем список уведомлений
        fetchNotifications();
      }
    } catch (error) {
      console.error('Ошибка отметки всех уведомлений:', error);
    }
  }, [fetchNotifications]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      // Убираем символ @ если пользователь его ввел
      const cleanQuery = searchQuery.replace('@', '');
      const response = await makeAuthenticatedRequest(
        `http://93.183.80.220/api/users/search/?q=${encodeURIComponent(cleanQuery)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Результаты поиска пользователей:', data);
        console.log('Пользователи из API:', data.users);
        setSearchResults(data.users || []);
      } else {
        console.error('Ошибка поиска пользователей:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await makeAuthenticatedRequest(
        `http://93.183.80.220/api/users/follow/${userId}/`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        // Обновляем поиск
        searchUsers();
      }
    } catch (error) {
      console.error('Ошибка подписки:', error);
    }
  };


  const handleUnfollow = async (userId) => {
    try {
      const response = await makeAuthenticatedRequest(
        `http://93.183.80.220/api/users/unfollow/${userId}/`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        // Обновляем поиск
        searchUsers();
      }
    } catch (error) {
      console.error('Ошибка отписки:', error);
    }
  };

  const handleStartChat = async (userId, userName) => {
    // Открываем модальное окно чата
    setSelectedUser({
      id: userId,
      name: userName
    });
    setModalOpen(true);
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

  const renderUserCard = (user) => {
    console.log('Рендерим карточку пользователя:', user);
    return (
      <div 
        key={user.id} 
        className="user-card clickable"
        onClick={() => {
          console.log('Клик по карточке пользователя:', user);
          console.log('Текущий URL:', window.location.href);
          if (user.id) {
            console.log('Переходим на профиль пользователя ID:', user.id);
            const targetUrl = `/user/${user.id}`;
            console.log('Целевой URL:', targetUrl);
            navigate(targetUrl);
          } else {
            console.error('ID пользователя не найден:', user);
          }
        }}
        title="Перейти к профилю"
      >
      <div className="user-header">
        <div 
          className="user-avatar"
          onClick={(e) => {
            e.stopPropagation(); // Предотвращаем всплытие события
            console.log('Клик по аватару пользователя:', user);
            if (user.id) {
              console.log('Переходим на профиль пользователя ID:', user.id);
              navigate(`/user/${user.id}`);
            } else {
              console.error('ID пользователя не найден:', user);
            }
          }}
          title="Перейти к профилю"
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.first_name || user.username} />
          ) : (
            <div className="avatar-placeholder">
              {getAuthorInitials(user.first_name || user.username)}
            </div>
          )}
        </div>
        <div className="user-info">
          <h3 
            className="user-name"
            onClick={(e) => {
              e.stopPropagation(); // Предотвращаем всплытие события
              console.log('Клик по имени пользователя:', user);
              if (user.id) {
                console.log('Переходим на профиль пользователя ID:', user.id);
                navigate(`/user/${user.id}`);
              } else {
                console.error('ID пользователя не найден:', user);
              }
            }}
            title="Перейти к профилю"
          >
            {user.first_name || user.username}
          </h3>
          <div className="user-login">@{user.username}</div>
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
      </div>
      
      <div className="user-actions">
        <button
          className="chat-btn"
          onClick={(e) => {
            e.stopPropagation();
            const userName = `${user.first_name} ${user.last_name}`.trim() || user.username || 'Пользователь';
            handleStartChat(user.id, userName);
          }}
          title="Написать сообщение"
        >
          <FontAwesomeIcon icon={faMessage} />
          Написать
        </button>
        {user.is_following ? (
          <button 
            className="unfollow-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleUnfollow(user.id);
            }}
          >
            <FontAwesomeIcon icon={faUserMinus} />
            Отписаться
          </button>
        ) : (
          <button 
            className="follow-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleFollow(user.id);
            }}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            Подписаться
          </button>
        )}
      </div>
    </div>
    );
  };

  const renderNotification = (notification) => (
    <div key={notification.id} className={`notification-card ${!notification.is_read ? 'unread' : ''}`}>
      <div className="notification-header">
        <div 
          className="notification-avatar clickable"
          onClick={() => {
            if (notification.sender?.id) {
              navigate(`/user/${notification.sender.id}`);
            } else {
              console.error('ID отправителя уведомления не найден:', notification);
            }
          }}
          title="Перейти к профилю"
        >
          {notification.sender?.avatar ? (
            <img src={notification.sender.avatar} alt={notification.sender.first_name || notification.sender.username} />
          ) : (
            <div className="avatar-placeholder">
              {getAuthorInitials(notification.sender?.first_name || notification.sender?.username)}
            </div>
          )}
        </div>
        <div className="notification-info">
          <div className="notification-message">
            <div className="notification-content">
              {notification.notification_type === 'message' && (
                <FontAwesomeIcon icon={faMessage} className="notification-icon message-icon" />
              )}
              {notification.notification_type === 'follow' && (
                <FontAwesomeIcon icon={faUserPlus} className="notification-icon follow-icon" />
              )}
              {notification.notification_type === 'like' && (
                <FontAwesomeIcon icon={faHeart} className="notification-icon like-icon" />
              )}
              {notification.notification_type === 'comment' && (
                <FontAwesomeIcon icon={faComment} className="notification-icon comment-icon" />
              )}
              <span className="notification-text">{notification.message}</span>
            </div>
            {notification.post_info && (
              <div 
                className="notification-post-link clickable"
                onClick={() => navigate(`/post/${notification.post_info.slug}`)}
                title="Перейти к посту"
              >
                <span className="post-title">"{notification.post_info.title}"</span>
                {notification.post_info.category && (
                  <span className="post-category"> в категории {notification.post_info.category}</span>
                )}
              </div>
            )}
            {notification.notification_type === 'message' && (
              <button 
                className="open-chat-btn"
                onClick={() => {
                  const userName = `${notification.sender?.first_name} ${notification.sender?.last_name}`.trim() || notification.sender?.username || 'Пользователь';
                  handleStartChat(notification.sender?.id, userName);
                }}
                title="Открыть чат"
              >
                <FontAwesomeIcon icon={faMessage} />
                Открыть чат
              </button>
            )}
          </div>
          <div className="notification-time">{formatDate(notification.created_at)}</div>
        </div>
        {!notification.is_read && (
          <button 
            className="mark-read-btn"
            onClick={() => markNotificationAsRead(notification.id)}
            title="Отметить как прочитанное"
          >
            <FontAwesomeIcon icon={faCheck} />
          </button>
        )}
      </div>
    </div>
  );

  // Загружаем уведомления при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab, fetchNotifications]);

  // Автоматическое обновление уведомлений каждые 30 секунд
  useEffect(() => {
    let intervalId;
    
    if (activeTab === 'notifications') {
      intervalId = setInterval(() => {
        fetchNotifications();
      }, 30000); // 30 секунд
    }

    // Cleanup функция для очистки интервала
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTab, fetchNotifications]);

  if (!isLoggedIn()) {
    return (
      <div className="friends-page">
        <div className="friends-container">
          <div className="auth-required">
            <h2>Требуется авторизация</h2>
            <p>Для просмотра друзей и уведомлений необходимо войти в систему</p>
            <button className="auth-btn" onClick={() => navigate('/auth')}>
              Войти в систему
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-page">
      <div className="friends-container">
        <div className="friends-header">
          <button onClick={() => navigate('/')} className="btn-back">
            <FontAwesomeIcon icon={faArrowLeft} />
            Назад
          </button>
          <h1 className="friends-title">
            <FontAwesomeIcon icon={faUserFriends} />
            Друзья
            {unreadNotificationsCount > 0 && (
              <span className="header-notification-badge">
                {unreadNotificationsCount}
              </span>
            )}
          </h1>
        </div>

        <div className="friends-content">
          {/* Вкладки */}
          <div className="friends-tabs">
            <button 
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <FontAwesomeIcon icon={faSearch} />
              Поиск пользователей
            </button>
            <button 
              className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <FontAwesomeIcon icon={faBell} />
              Уведомления
              {unreadNotificationsCount > 0 && (
                <span className="notification-badge">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>

          {/* Секция поиска */}
          {activeTab === 'search' && (
            <div className="search-section">
              <div className="search-header">
                <h2>Найти пользователей</h2>
                <p>Ищите по имени или логину (с символом @ или без него)</p>
              </div>
              
              <form className="search-form" onSubmit={(e) => { e.preventDefault(); searchUsers(); }}>
                <div className="search-input-wrapper">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Введите имя или @логин пользователя..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  className="search-btn"
                  disabled={searchLoading || !searchQuery.trim()}
                >
                  {searchLoading ? 'Поиск...' : 'Найти'}
                </button>
              </form>

              {searchLoading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <p>Поиск пользователей...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="search-results">
                  <h3>Результаты поиска ({searchResults.length})</h3>
                  <div className="users-grid">
                    {searchResults.map(renderUserCard)}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Секция уведомлений */}
          {activeTab === 'notifications' && (
            <div className="notifications-section">
              <div className="section-header">
                <h2>Уведомления</h2>
                <p>Ваши последние уведомления и активности</p>
              </div>
              
              {notificationsLoading ? (
                <div className="loading">
                  <div className="loading-spinner"></div>
                  <p>Загрузка уведомлений...</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="notifications-content">
                  <div className="notifications-header">
                    <h3>Уведомления ({notifications.length})</h3>
                    <div className="notifications-actions">
                      {unreadNotificationsCount > 0 && (
                        <button 
                          className="mark-all-read-btn"
                          onClick={markAllNotificationsAsRead}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                          Отметить все как прочитанные
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="notifications-list">
                    {notifications.map(renderNotification)}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <h3>Уведомлений пока нет</h3>
                  <p>Когда кто-то подпишется на вас или оставит комментарий, вы увидите уведомления здесь</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно чата */}
      <ChatModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?.id}
        userName={selectedUser?.name}
      />
    </div>
  );
};

// Мемоизируем компонент для предотвращения ненужных ререндеров
export default memo(FriendsPage);
