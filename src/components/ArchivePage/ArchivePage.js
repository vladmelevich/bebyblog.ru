import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBookmark, 
  faMapMarkerAlt, 
  faCalendar,
  faArrowLeft,
  faEye,
  faClock,
  faUser,
  faTag
} from '@fortawesome/free-solid-svg-icons';
import './ArchivePage.css';

const ArchivePage = () => {
  const [archivedPosts, setArchivedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchArchivedPosts();
  }, []);

  const fetchArchivedPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

      if (!token) {
        setError('Необходима авторизация');
        setLoading(false);
        return;
      }

      const response = await fetch('http://46.149.70.4/api/users/archive/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Данные архива:', data);
        if (data.results && data.results.length > 0) {
          console.log('Первый пост:', data.results[0]);
          console.log('Аватар первого автора:', data.results[0].author?.avatar);
        }
        setArchivedPosts(data.results || []);
      } else {
        setError('Ошибка загрузки архива');
      }
    } catch (error) {
      setError('Ошибка загрузки архива');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Только что';
      if (diffInHours < 24) return `${diffInHours} ч назад`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} дн назад`;
      
      return date.toLocaleDateString('ru-RU');
    } catch (error) {
      return 'Недавно';
    }
  };

  const getAuthorInitials = (author) => {
    if (!author) return 'А';
    const firstName = author.first_name || '';
    const lastName = author.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'А';
  };

  const getAvatarUrl = (author) => {
    if (!author) return null;
    
    // Проверяем разные варианты аватара
    if (author.avatar_url) return author.avatar_url;
    if (author.avatar && author.avatar !== 'null' && author.avatar !== '') {
      // Если это относительный путь, добавляем базовый URL
      if (author.avatar.startsWith('/')) {
        return `http://46.149.70.4${author.avatar}`;
      }
      return author.avatar;
    }
    return null;
  };

  const getCategoryColor = (categoryName) => {
    const colors = {
      'Технологии': '#3b82f6',
      'Образование': '#10b981',
      'Здоровье': '#ef4444',
      'Спорт': '#f59e0b',
      'Культура': '#8b5cf6',
      'Наука': '#06b6d4',
      'Бизнес': '#84cc16',
      'default': '#6b7280'
    };
    return colors[categoryName] || colors.default;
  };

  const filteredPosts = selectedCategory === 'all' 
    ? archivedPosts 
    : archivedPosts.filter(post => post.category?.name === selectedCategory);

  const categories = ['all', ...new Set(archivedPosts.map(post => post.category?.name).filter(Boolean))];

  if (loading) {
    return (
      <div className="archive-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Загружаем ваш архив...</h3>
          <p>Собираем все сохраненные посты</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="archive-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Что-то пошло не так</h2>
          <p>{error}</p>
          <button onClick={fetchArchivedPosts} className="btn-retry">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="archive-page">
      {/* Хлебные крошки */}
      <div className="breadcrumbs-container">
        <nav className="breadcrumbs">
          <Link to="/" className="breadcrumb-link">
            <FontAwesomeIcon icon={faArrowLeft} />
            Главная
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-link active">Архив</span>
        </nav>
      </div>

      {/* Заголовок */}
      <div className="archive-header">
        <div className="archive-title">
          <div className="archive-icon-wrapper">
            <FontAwesomeIcon icon={faBookmark} className="archive-icon" />
          </div>
          <div className="archive-title-text">
            <h1>Мой архив</h1>
            <p>Ваши сохраненные посты и статьи</p>
          </div>
        </div>
        <div className="archive-stats">
          <div className="stat-item">
            <span className="stat-number">{archivedPosts.length}</span>
            <span className="stat-label">постов</span>
          </div>
        </div>
      </div>

      {/* Фильтры по категориям */}
      {archivedPosts.length > 0 && (
        <div className="archive-filters">
          <div className="filter-tabs">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'Все' : category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Список постов */}
      <div className="archive-content">
        {archivedPosts.length === 0 ? (
          <div className="archive-empty">
            <div className="empty-container">
              <div className="empty-icon-wrapper">
                <FontAwesomeIcon icon={faBookmark} className="empty-icon" />
              </div>
              <h3>Архив пуст</h3>
              <p>Вы пока не сохранили ни одного поста в архив</p>
              <Link to="/posts" className="btn-browse-posts">
                <FontAwesomeIcon icon={faEye} />
                Просмотреть посты
              </Link>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="archive-empty">
            <div className="empty-container">
              <div className="empty-icon-wrapper">
                <FontAwesomeIcon icon={faTag} className="empty-icon" />
              </div>
              <h3>Нет постов в этой категории</h3>
              <p>Попробуйте выбрать другую категорию</p>
            </div>
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map((post) => (
              <div key={post.id} className="post-card">
                {/* Верхняя часть карточки */}
                <div className="post-card-header">
                  <div className="post-category" style={{ 
                    backgroundColor: getCategoryColor(post.category?.name) + '20',
                    color: getCategoryColor(post.category?.name)
                  }}>
                    <FontAwesomeIcon icon={faTag} />
                    {post.category?.name || 'Общее'}
                  </div>
                  <div className="post-archived-date">
                    <FontAwesomeIcon icon={faClock} />
                    {formatDate(post.archived_at)}
                  </div>
                </div>

                {/* Заголовок */}
                <div 
                  className="post-title"
                  onClick={() => {
                    const postSlug = post.slug && post.slug !== 'post' ? post.slug : post.id;
                    navigate(`/post-detail/${postSlug}`);
                  }}
                >
                  {post.title}
                </div>
                
                {/* Автор */}
                <div className="post-author">
                  <div className="author-avatar">
                    {(() => {
                      const avatarUrl = getAvatarUrl(post.author);
                      if (avatarUrl) {
                        return (
                          <img 
                            src={avatarUrl} 
                            alt={post.author?.first_name || 'Автор'}
                            onError={(e) => {
                              console.log('Ошибка загрузки аватара:', avatarUrl);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            onLoad={(e) => {
                              console.log('Аватар загружен успешно:', avatarUrl);
                            }}
                          />
                        );
                      }
                      return null;
                    })()}
                    <div className="author-initials" style={{ 
                      display: getAvatarUrl(post.author) ? 'none' : 'flex',
                      backgroundColor: getCategoryColor(post.category?.name)
                    }}>
                      {getAuthorInitials(post.author)}
                    </div>
                  </div>
                  <div className="author-info">
                    <span className="author-name">
                      <FontAwesomeIcon icon={faUser} />
                      {post.author?.first_name || post.author?.username || 'Пользователь'}
                    </span>
                    <span className="author-location">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      {post.author?.city || 'Не указан'}
                    </span>
                    <span className="post-date">
                      <FontAwesomeIcon icon={faCalendar} />
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                </div>
                
                {/* Отрывок текста */}
                {post.content && (
                  <div className="post-excerpt">
                    <p>{post.content.length > 120 ? `${post.content.substring(0, 120)}...` : post.content}</p>
                  </div>
                )}
                
                {/* Кнопка действия */}
                <div className="post-action">
                  <button 
                    className="read-more-btn"
                    onClick={() => {
                      const postSlug = post.slug && post.slug !== 'post' ? post.slug : post.id;
                      navigate(`/post-detail/${postSlug}`);
                    }}
                  >
                    <FontAwesomeIcon icon={faEye} />
                    Читать статью
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;
