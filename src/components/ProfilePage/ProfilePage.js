import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ProfilePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getApiUrl } from '../../config/api';
import { 
  faArrowLeft, 
  faPlus, 
  faUser, 
  faMapMarkerAlt, 
  faCalendar,
  faBaby,
  faEye,
  faEyeSlash,
  faPencilAlt,
  faMars,
  faVenus,
  faTimes,
  faUserEdit,
  faBabyCarriage,
  faUsers,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import AddChildModal from './AddChildModal';
import SubscriptionsModal from './SubscriptionsModal';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false);
  const [subscriptionsModalType, setSubscriptionsModalType] = useState('followers');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    fetchUserProfile();
    fetchChildrenData();
  }, [userId]);

  // Обновляем данные при фокусе на окне (когда пользователь возвращается на страницу)
  useEffect(() => {
    const handleFocus = () => {
      fetchUserProfile();
      fetchChildrenData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Получаем токен
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      if (!token) {
        setError('Пользователь не авторизован');
        setLoading(false);
        navigate('/auth');
        return;
      }
      
      // Принудительно получаем свежие данные пользователя из API
      const userResponse = await fetch(getApiUrl('/users/profile/'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!userResponse.ok) {
        throw new Error('Ошибка получения данных пользователя');
      }
      
      const currentUserResponse = await userResponse.json();
      console.log('🔍 Свежие данные пользователя из API:', currentUserResponse);
      console.log('🔍 Структура ответа:', JSON.stringify(currentUserResponse, null, 2));
      
      // Извлекаем данные пользователя из ответа API
      let userData = null;
      if (currentUserResponse.id) {
        // Данные пользователя в корне ответа
        userData = currentUserResponse;
        console.log('✅ Данные пользователя в корне:', userData);
      } else if (currentUserResponse.success && currentUserResponse.user) {
        userData = currentUserResponse.user;
        console.log('✅ Данные пользователя из success.user:', userData);
      } else if (currentUserResponse.user) {
        userData = currentUserResponse.user;
        console.log('✅ Данные пользователя из user:', userData);
      } else {
        console.error('❌ Не удалось извлечь данные пользователя из ответа');
        throw new Error('Неверный формат ответа API');
      }
      
      console.log('🔍 userData:', userData);
      console.log('🔍 userData.id:', userData ? userData.id : 'null');
      console.log('🔍 userData.id тип:', typeof (userData ? userData.id : null));
      console.log('🔍 Все ключи объекта:', userData ? Object.keys(userData) : 'null');
      console.log('🔍 userId из URL:', userId);
      console.log('🔍 userId тип:', typeof userId);
      
      // Извлекаем ID пользователя
      const actualUserId = userData ? userData.id : null;
      
      console.log('🔍 Извлеченный ID пользователя:', actualUserId);
      
      // Если userId не определен или это ID текущего пользователя, используем ID текущего пользователя
      let targetUserId = userId;
      if (!targetUserId || targetUserId === 'undefined') {
        if (actualUserId) {
          targetUserId = actualUserId;
          console.log('userId не определен, используем ID текущего пользователя:', targetUserId);
        } else {
          console.error('❌ Не удалось получить ID пользователя');
          throw new Error('Не удалось получить ID пользователя');
        }
      } else if (actualUserId && (actualUserId == userId || actualUserId == parseInt(userId))) {
        targetUserId = actualUserId;
        console.log('Это профиль текущего пользователя:', targetUserId);
      } else {
        // Если это чужой профиль, перенаправляем на UserProfilePage
        console.log('Это чужой профиль, перенаправляем на UserProfilePage');
        navigate(`/user/${userId}`);
        return;
      }
      
      console.log('Итоговый targetUserId:', targetUserId);
      
      // Проверяем, что targetUserId определен
      if (!targetUserId || targetUserId === 'undefined') {
        console.error('targetUserId не определен:', targetUserId);
        // Используем статические данные вместо ошибки
        const staticUser = {
          id: 1,
          first_name: 'Пользователь',
          username: 'user',
          city: 'Москва',
          date_joined: new Date().toISOString(),
          avatar: null,
          followers_count: 0,
          following_count: 0
        };
        setUser(staticUser);
        setFollowersCount(0);
        setFollowingCount(0);
        setPosts([]);
        setDrafts([]);
        setLoading(false);
        return;
      }
      
      // Используем уже полученный токен
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Получаем данные пользователя с постами и счетчиками подписок
      const profileWithPostsResponse = await fetch(getApiUrl(`/users/profile-with-posts/${targetUserId}/`), {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (profileWithPostsResponse.ok) {
        const userDataResponse = await profileWithPostsResponse.json();
        console.log('Данные пользователя с сервера:', userDataResponse);
        
        // Извлекаем данные пользователя из ответа API
        let userInfo = null;
        if (userDataResponse.id) {
          // Данные пользователя в корне ответа
          userInfo = userDataResponse;
          console.log('✅ Данные пользователя в корне:', userInfo);
        } else if (userDataResponse.success && userDataResponse.user) {
          userInfo = userDataResponse.user;
          console.log('✅ Данные пользователя из success.user:', userInfo);
        } else if (userDataResponse.user) {
          userInfo = userDataResponse.user;
          console.log('✅ Данные пользователя из user:', userInfo);
        }
        
        console.log('🔍 Извлеченные данные пользователя:', userInfo);
        
        if (userInfo && userInfo.id) {
          setUser(userInfo);
          setFollowersCount(userInfo.followers_count || 0);
          setFollowingCount(userInfo.following_count || 0);
        } else {
          console.error('❌ Не удалось извлечь данные пользователя из ответа');
          // Используем данные из /users/profile/ как фолбек
          if (userData && userData.id) {
            setUser(userData);
            setFollowersCount(0);
            setFollowingCount(0);
          } else {
            // Финальный фолбек на статические данные
            const fallbackUser = {
              id: targetUserId || 1,
              first_name: 'Пользователь',
              username: 'user',
              city: 'Москва',
              date_joined: new Date().toISOString(),
              avatar: null,
              followers_count: 0,
              following_count: 0
            };
            setUser(fallbackUser);
            setFollowersCount(0);
            setFollowingCount(0);
          }
        }
      } else {
        console.error('Ошибка получения пользователя с сервера:', profileWithPostsResponse.status);
        // Фолбек: используем данные из /users/profile/
        if (userData && userData.id) {
          setUser(userData);
          setFollowersCount(0);
          setFollowingCount(0);
        } else {
          console.error('❌ Не удалось использовать фолбек данные');
          // Финальный фолбек на статические данные
          const finalFallbackUser = {
            id: targetUserId || 1,
            first_name: 'Пользователь',
            username: 'user',
            city: 'Москва',
            date_joined: new Date().toISOString(),
            avatar: null,
            followers_count: 0,
            following_count: 0
          };
          setUser(finalFallbackUser);
          setFollowersCount(0);
          setFollowingCount(0);
        }
      }

      // Получаем посты пользователя
      const postsResponse = await fetch(`http://93.183.80.220/api/posts/?author=${targetUserId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        const allPosts = postsData.results || postsData;
        
        // Фильтруем посты только текущего пользователя
        const userPosts = allPosts.filter(post => {
          const postAuthorId = post.author?.id || post.author_id;
          return postAuthorId == targetUserId;
        });
        
        console.log('Все посты пользователя:', userPosts);
        
        // Разделяем посты по статусам
        const publishedPosts = userPosts.filter(post => 
          post.status === 'published' || post.status === 'PUBLISHED' || post.status === 1
        );
        const draftPosts = userPosts.filter(post => 
          post.status === 'draft' || post.status === 'DRAFT' || post.status === 0
        );
        console.log('Опубликованные посты:', publishedPosts);
        console.log('Черновики:', draftPosts);
        
        setPosts(publishedPosts);
        setDrafts(draftPosts);
      } else {
        console.error('Ошибка получения постов:', postsResponse.status);
        setPosts([]);
        setDrafts([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      // Вместо ошибки используем статические данные
      const errorFallbackUser = {
        id: userId || 1,
        first_name: 'Пользователь',
        username: 'user',
        city: 'Москва',
        date_joined: new Date().toISOString(),
        avatar: null,
        followers_count: 0,
        following_count: 0
      };
      setUser(errorFallbackUser);
      setFollowersCount(0);
      setFollowingCount(0);
      setPosts([]);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
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

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age === 0) {
      const monthAge = monthDiff < 0 ? monthDiff + 12 : monthDiff;
      return `${monthAge} мес`;
    }
    
    return `${age} ${getAgeWord(age)}`;
  };

  const getAgeWord = (age) => {
    if (age >= 11 && age <= 19) return 'лет';
    const lastDigit = age % 10;
    if (lastDigit === 1) return 'год';
    if (lastDigit >= 2 && lastDigit <= 4) return 'года';
    return 'лет';
  };

  const handleAddChild = async (childData) => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      if (!token) {
        console.error('Токен не найден');
        alert('Ошибка авторизации. Войдите в систему заново.');
        return;
      }

      console.log('🔍 Данные для отправки:', childData);
      console.log('🔍 Токен:', token ? 'Есть' : 'Нет');

      const requestData = {
        name: childData.name,
        gender: childData.gender,
        birth_date: childData.birthDate
      };

      console.log('🔍 Данные запроса:', requestData);

      const response = await fetch(getApiUrl('/users/children/'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('🔍 Статус ответа:', response.status);
      console.log('🔍 Заголовки ответа:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Ребенок успешно добавлен:', data);
        
        // Обновляем список детей
        fetchChildrenData();
        alert('Ребенок успешно добавлен!');
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка добавления ребенка:', response.status, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Детали ошибки:', errorData);
          alert(`Ошибка при добавлении ребенка: ${errorData.message || errorText}`);
        } catch (e) {
          console.error('❌ Не удалось распарсить ошибку:', e);
          alert(`Ошибка при добавлении ребенка (${response.status}): ${errorText}`);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка при добавлении ребенка:', error);
      alert(`Ошибка при добавлении ребенка: ${error.message}`);
    }
  };

  const fetchChildrenData = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      if (!token) {
        console.log('Токен не найден, дети не загружены');
        setChildren([]);
        return;
      }

             const response = await fetch(getApiUrl('/users/children/'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Дети загружены с сервера:', data);
        setChildren(data.children || []);
      } else {
        console.error('Ошибка загрузки детей с сервера:', response.status);
        setChildren([]);
      }
    } catch (error) {
      console.error('Ошибка при загрузке детей с сервера:', error);
      setChildren([]);
    }
  };

  const handleDeleteChild = async (childId) => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      if (!token) {
        console.error('Токен не найден');
        return;
      }

      const response = await fetch(`http://93.183.80.220/api/users/children/${childId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        console.log('Ребенок успешно удален');
        // Обновляем список детей
        fetchChildrenData();
      } else {
        console.error('Ошибка удаления ребенка:', response.status);
        alert('Ошибка при удалении ребенка. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка при удалении ребенка:', error);
      alert('Ошибка при удалении ребенка. Попробуйте еще раз.');
    }
  };

  const handleOpenSubscriptionsModal = (type) => {
    setSubscriptionsModalType(type);
    setShowSubscriptionsModal(true);
  };

  const handleCloseSubscriptionsModal = () => {
    setShowSubscriptionsModal(false);
    // Обновляем данные профиля после закрытия модального окна
    setTimeout(() => {
      fetchUserProfile();
    }, 100);
  };



  const renderPosts = (postsList, type) => {
    if (postsList.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <FontAwesomeIcon icon={type === 'drafts' ? faPencilAlt : type === 'archived' ? faArchive : faUser} />
          </div>
          <p className="empty-title">
            {type === 'drafts' ? 'Черновиков пока нет' : 'Постов пока нет'}
          </p>
          <p className="empty-description">
            {type === 'drafts' ? 'Создайте свой первый черновик' : 'Создайте свою первую запись'}
          </p>
        </div>
      );
    }

         return (
       <div className="posts-grid">
         {postsList.map((post) => (
           <div key={post.id} className="post-item">
             {/* Заголовок */}
             <div 
               className="post-title clickable-title"
               onClick={(e) => {
                 console.log('=== КЛИК ПО ЗАГОЛОВКУ ===');
                 console.log('Заголовок:', post.title);
                 console.log('ID поста:', post.id);
                 console.log('Slug поста:', post.slug);
                 
                 const postSlug = post.slug && post.slug !== 'post' ? post.slug : post.id;
                 console.log('URL для перехода:', `/post-detail/${postSlug}`);
                 e.stopPropagation();
                 navigate(`/post-detail/${postSlug}`);
               }}
             >
               {console.log('Пост для отладки:', { id: post.id, title: post.title, slug: post.slug })}
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
                     src={user.avatar.startsWith('http') ? user.avatar : `http://93.183.80.220${user.avatar}`} 
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
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-error">
        <h2>Ошибка</h2>
        <p>{error || 'Пользователь не найден'}</p>
        <p>ID пользователя: {userId}</p>
        <button onClick={() => navigate('/')} className="btn-back">
          <FontAwesomeIcon icon={faArrowLeft} />
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Кнопка назад */}
        <div className="profile-header">
          <button onClick={() => navigate('/')} className="btn-back">
            <FontAwesomeIcon icon={faArrowLeft} />
            Назад
          </button>
        </div>

        {/* Информация о пользователе */}
        <div className="user-profile-section">
          <div className="user-avatar">
            {user?.avatar ? (
              <img 
                src={user.avatar.startsWith('http') ? user.avatar : `http://93.183.80.220${user.avatar}`}
                alt={user.first_name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                {user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'П'}
              </div>
            )}
          </div>
          <div className="user-info">
            <h1 className="user-name">{user?.first_name || 'Пользователь'}</h1>
            <div className="user-login">@{user?.username || 'user'}</div>
            <div className="user-details">
              <span className="user-location">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                {user?.city || 'Не указан'}
              </span>
              <span className="user-join-date">
                <FontAwesomeIcon icon={faCalendar} />
                {user?.date_joined ? new Date(user.date_joined).toLocaleDateString('ru-RU') : 'Недавно'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="user-actions">
          <button 
            className="btn-add-child"
            onClick={() => setShowAddChildModal(true)}
          >
            <FontAwesomeIcon icon={faBaby} />
            Добавить ребенка
          </button>
        </div>

                 {/* Дети пользователя */}
         {children.length > 0 && (
           <div className="user-children-section">
             <h3 className="children-title">
               <FontAwesomeIcon icon={faBaby} />
               Мои дети
             </h3>
             <div className="children-grid">
                               {children.map((child) => (
                  <div key={child.id} className="child-card">
                    <div className="child-avatar">
                      <FontAwesomeIcon 
                        icon={child.gender === 'male' ? faMars : faVenus} 
                        className={`gender-icon ${child.gender}`}
                      />
                    </div>
                    <div className="child-info">
                      <div className="child-name">{child.name}</div>
                      <div className="child-age">{child.age}</div>
                    </div>
                    <button 
                      className="child-delete-btn"
                      onClick={() => handleDeleteChild(child.id)}
                      title="Удалить ребенка"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
             </div>
           </div>
         )}

        {/* Подписчики и подписки */}
        <div className="user-subscriptions-section">
          <div className="subscriptions-grid">
            <div 
              className="subscription-card clickable"
              onClick={() => handleOpenSubscriptionsModal('followers')}
            >
              <div className="subscription-icon">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <div className="subscription-info">
                <div className="subscription-count">{followersCount}</div>
                <div className="subscription-label">Подписчики</div>
              </div>
            </div>
            
            <div 
              className="subscription-card clickable"
              onClick={() => handleOpenSubscriptionsModal('following')}
            >
              <div className="subscription-icon">
                <FontAwesomeIcon icon={faUserPlus} />
              </div>
              <div className="subscription-info">
                <div className="subscription-count">{followingCount}</div>
                <div className="subscription-label">Подписки</div>
              </div>
            </div>
          </div>
        </div>



        {/* Вкладки */}
        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <FontAwesomeIcon icon={faUser} />
            Записи ({posts.length})
          </button>
          <button 
            className={`tab ${activeTab === 'drafts' ? 'active' : ''}`}
            onClick={() => setActiveTab('drafts')}
          >
            <FontAwesomeIcon icon={faPencilAlt} />
            Черновики ({drafts.length})
          </button>
        </div>

        {/* Контент вкладок */}
        <div className="tab-content">
          {activeTab === 'posts' && renderPosts(posts, 'posts')}
          {activeTab === 'drafts' && renderPosts(drafts, 'drafts')}
        </div>
       </div>

       {/* Модальное окно добавления ребенка */}
       <AddChildModal
         isOpen={showAddChildModal}
         onClose={() => setShowAddChildModal(false)}
         onAddChild={handleAddChild}
       />

       {/* Модальное окно подписок */}
       <SubscriptionsModal
         isOpen={showSubscriptionsModal}
         onClose={handleCloseSubscriptionsModal}
         type={subscriptionsModalType}
         userId={user?.id}
         onUpdate={fetchUserProfile}
       />
     </div>
   );
 };

export default ProfilePage;
