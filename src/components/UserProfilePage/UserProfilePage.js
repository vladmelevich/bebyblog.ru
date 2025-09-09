import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatModal from '../ChatModal/ChatModal';
import './UserProfilePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getApiUrl } from '../../config/api';
import { 
  faArrowLeft, 
  faMapMarkerAlt, 
  faCalendar,
  faBaby,
  faEye,
  faEyeSlash,
  faArchive,
  faMars,
  faVenus,
  faUserPlus,
  faComments
} from '@fortawesome/free-solid-svg-icons';

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    console.log('UserProfilePage загружен для userId:', userId);
    fetchUserProfile();
    loadChildrenData();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      console.log('Загружаем профиль пользователя с ID:', userId);
      setLoading(true);
      
      // Проверяем, есть ли токен
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      // Получаем токен авторизации
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Получаем данные пользователя с постами и детьми
      const userUrl = getApiUrl(`/users/profile-with-posts/${userId}/`);
      
      const userResponse = await fetch(userUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('📊 Ответ API для профиля пользователя:', userData);
        
        // Проверяем структуру ответа
        if (userData.success && userData.user) {
          const user = userData.user;
          console.log('✅ Пользователь найден (с success):', user);
          setUser(user);
          
          // Сохраняем данные о детях
          if (user.children) {
            setChildren(user.children);
          }
        } else if (userData.user) {
          // Если нет поля success, но есть user
          const user = userData.user;
          console.log('✅ Пользователь найден (без success):', user);
          setUser(user);
          
          if (user.children) {
            setChildren(user.children);
          }
        } else if (userData.id) {
          // Если данные пользователя находятся прямо в корне ответа
          console.log('✅ Пользователь найден (в корне):', userData);
          setUser(userData);
          
          if (userData.children) {
            setChildren(userData.children);
          }
        } else {
          // Если структура неожиданная
          console.error('❌ Неожиданная структура данных:', userData);
          setError('Ошибка в структуре данных пользователя');
        }
      } else {
        if (userResponse.status === 401) {
          setError('Для просмотра профиля необходимо войти в систему');
        } else if (userResponse.status === 404) {
          setError(`Пользователь с ID ${userId} не найден`);
        } else {
          setError(`Ошибка загрузки профиля: ${userResponse.status} ${userResponse.statusText}`);
        }
      }

      // Получаем только опубликованные посты пользователя
      const postsUrl = `http://93.183.80.220/api/posts/user/${userId}/published/`;
      
      const postsResponse = await fetch(postsUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        
        // Проверяем структуру ответа
        if (postsData.success && postsData.posts) {
          setPosts(postsData.posts);
        } else if (postsData.posts) {
          setPosts(postsData.posts);
        } else if (Array.isArray(postsData)) {
          setPosts(postsData);
        } else {
          setPosts([]);
        }
      } else {
        setPosts([]);
      }

      // Проверяем статус подписки
      if (token) {
        try {
          const subscriptionResponse = await fetch(`http://93.183.80.220/api/users/check-subscription/${userId}/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });

          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json();
            setIsSubscribed(subscriptionData.is_subscribed || false);
          } else {
            setIsSubscribed(false);
          }
        } catch (error) {
          setIsSubscribed(false);
        }
      }
    } catch (error) {
      setError('Ошибка загрузки профиля пользователя');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChildrenData = async () => {
    try {
      // Получаем детей через API профиля пользователя
      const response = await fetch(`http://93.183.80.220/api/users/profile-with-posts/${userId}/`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user && data.user.children) {
          setChildren(data.user.children);
        }
      }
    } catch (error) {
      // Ошибка загрузки детей
    }
  };

  const handleSubscribe = async () => {
    if (!isLoggedIn()) {
      alert('Для подписки необходимо войти в систему');
      return;
    }

    setIsSubscribing(true);
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      if (isSubscribed) {
        // Отписка
        const response = await fetch(`http://93.183.80.220/api/users/unfollow/${userId}/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(false);
          // Обновляем данные профиля
          fetchUserProfile();
        } else {
          const errorData = await response.json();
          // Не показываем alert, просто логируем ошибку
        }
      } else {
        // Подписка
        const response = await fetch(`http://93.183.80.220/api/users/follow/${userId}/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(true);
          // Обновляем данные профиля
          fetchUserProfile();
        } else {
          const errorData = await response.json();
          // Не показываем alert, просто логируем ошибку
        }
      }
    } catch (error) {
      // Не показываем alert, просто логируем ошибку
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleStartChat = () => {
    if (!isLoggedIn()) {
      alert('Для начала чата необходимо войти в систему');
      return;
    }

    // Проверяем, что пользователь не пытается создать чат с самим собой
    const currentUserId = localStorage.getItem('user_id');
    if (currentUserId && parseInt(currentUserId) === parseInt(userId)) {
      alert('Нельзя создать чат с самим собой');
      return;
    }
    
    // Сразу открываем модальное окно чата
    const userName = user ? 
      (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 
       user.first_name || user.username || 'Пользователь') : 
      'Пользователь';
    
    setSelectedUser({
      id: userId,
      name: userName
    });
    setModalOpen(true);
  };

  const handleChatCreated = () => {
    // Уведомляем пользователя, что чат создан и появится в списке чатов
    console.log('Чат создан и будет отображаться в списке чатов');
  };

  const isLoggedIn = () => {
    return !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'));
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

  const renderPosts = () => {
    if (posts.length === 0) {
      return (
        <div className="empty-posts">
          <div className="empty-icon">
            <FontAwesomeIcon icon={faEye} />
          </div>
          <h3>Постов пока нет</h3>
          <p>Пользователь еще не создал публикаций</p>
        </div>
      );
    }

    return (
      <div className="posts-grid">
        {posts.map((post) => (
          <div key={post.id} className="post-item">
            {/* Заголовок */}
            <div 
              className="post-title clickable-title"
              onClick={(e) => {
                e.stopPropagation();
                const postSlug = post.slug && post.slug !== 'post' ? post.slug : post.id;
                navigate(`/post-detail/${postSlug}`);
              }}
            >
              {post.title}
            </div>
            
            {/* Тег */}
            <div className="post-tag">
              {post.category?.name || 'Общее'}
            </div>
            
            {/* Информация об авторе */}
            <div className="post-author">
              <div className="author-avatar">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.first_name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="author-initials" style={{ 
                  display: user?.avatar ? 'none' : 'flex' 
                }}>
                  {getAuthorInitials(user?.first_name || user?.username)}
                </div>
              </div>
              <div className="author-info">
                <span className="author-name">
                  {user?.first_name || user?.username || 'Пользователь'}
                </span>
                <span className="author-location">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  {user?.city || 'Не указан'}
                </span>
                <span className="post-date">
                  <FontAwesomeIcon icon={faCalendar} />
                  {formatDate(post.created_at)}
                </span>
              </div>
            </div>
            
            {/* Отрывок текста статьи */}
            {post.content && (
              <div className="post-excerpt">
                <p>{post.content.length > 67 ? `${post.content.substring(0, 67)}...` : post.content}</p>
              </div>
            )}
            
            {/* Кнопка "Читать дальше" */}
            <div className="post-read-more">
              <button 
                className="read-more-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  const postSlug = post.slug && post.slug !== 'post' ? post.slug : post.id;
                  navigate(`/post-detail/${postSlug}`);
                }}
              >
                Читать дальше
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="user-profile-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="user-profile-error">
        <h2>Ошибка</h2>
        <p>{error || 'Пользователь не найден'}</p>
        <button onClick={() => navigate('/')} className="btn-back">
          <FontAwesomeIcon icon={faArrowLeft} />
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="user-profile-container">
        {/* Кнопка назад */}
        <div className="user-profile-header">
          <button onClick={() => navigate('/')} className="btn-back">
            <FontAwesomeIcon icon={faArrowLeft} />
            Назад
          </button>
        </div>

        {/* Секция профиля пользователя */}
        <div className="user-profile-section">
          <div className="user-avatar">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.first_name || user.username}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="avatar-placeholder" style={{ 
              display: user.avatar ? 'none' : 'flex' 
            }}>
              {getAuthorInitials(user.first_name || user.username)}
            </div>
          </div>
          
          <div className="user-info">
            <h1 className="user-name">{user.first_name || user.username}</h1>
            <div className="user-login">@{user.username}</div>
            <div className="user-details">
              <span>
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                {user.city || 'Не указан'}
              </span>
              <span>
                <FontAwesomeIcon icon={faCalendar} />
                {formatDate(user.date_joined || user.created_at)}
              </span>
            </div>
            
            {/* Кнопки действий */}
            <div className="user-actions">
              <button 
                className={`action-btn subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
                onClick={handleSubscribe}
                disabled={isSubscribing}
              >
                <FontAwesomeIcon icon={faUserPlus} />
                {isSubscribing ? 'Загрузка...' : (isSubscribed ? 'Отписаться' : 'Подписаться')}
              </button>
              
              <button 
                className="action-btn chat-btn"
                onClick={handleStartChat}
              >
                <FontAwesomeIcon icon={faComments} />
                Начать чат
              </button>
            </div>
          </div>
        </div>

                 {/* Секция с детьми */}
         {children.length > 0 && (
           <div className="children-section">
             <div className="section-header">
               <FontAwesomeIcon icon={faBaby} />
               <h2>Дети</h2>
             </div>
             <div className="children-grid">
               {children.map((child) => (
                 <div key={child.id} className="child-card">
                   <div className={`child-avatar ${child.gender === 'female' ? 'female' : 'male'}`}>
                     <FontAwesomeIcon icon={child.gender === 'female' ? faVenus : faMars} />
                   </div>
                   <div className="child-info">
                     <div className="child-name">{child.name}</div>
                     <div className="child-age">{child.age}</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         )}



        {/* Табы */}
        <div className="tabs-section">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              Записи ({posts.length})
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="content-section">
          {activeTab === 'posts' && renderPosts()}
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
        onChatCreated={handleChatCreated}
      />
    </div>
  );
};

export default UserProfilePage;
