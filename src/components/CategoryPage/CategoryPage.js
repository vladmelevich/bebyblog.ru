import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendar, 
  faClipboard, 
  faStethoscope,
  faBaby,
  faCalculator,
  faHospital,
  faUsers,
  faBrain,
  faGamepad,
  faEllipsisV,
  faMapMarkerAlt,
  faChevronRight,
  faChevronLeft,
  faNewspaper,
  faBookOpen,
  faComment,
  faHeart
} from '@fortawesome/free-solid-svg-icons';
import './CategoryPage.css';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentServiceSlide, setCurrentServiceSlide] = useState(0);
  const servicesSliderRef = useRef(null);

  // Данные о категориях (только метаданные, без постов)
  const categoryMetadata = {
    "zachatie": {
      title: "Зачатие",
      icon: "heart",
      description: "Всё о планировании беременности и зачатии",
      services: [
        {
          title: "Рассчитать дату родов",
          icon: "calculator",
          description: "Узнайте предполагаемую дату рождения"
        },
        {
          title: "Отзывы о роддомах",
          icon: "hospital",
          description: "Выберите лучший роддом для родов"
        }
      ]
    },
    "beremennost": {
      title: "Беременность",
      icon: "baby",
      description: "Всё о беременности и подготовке к родам",
      services: [
        {
          title: "Рассчитать дату родов",
          icon: "calculator",
          description: "Узнайте предполагаемую дату рождения"
        },
        {
          title: "Отзывы о роддомах",
          icon: "hospital",
          description: "Выберите лучший роддом для родов"
        }
      ]
    },
    "eko-mama": {
      title: "ЭКО-мама",
      icon: "baby",
      description: "Всё об ЭКО и вспомогательных репродуктивных технологиях",
      services: [
        {
          title: "Рассчитать дату родов",
          icon: "calculator",
          description: "Узнайте предполагаемую дату рождения"
        },
        {
          title: "Отзывы о роддомах",
          icon: "hospital",
          description: "Выберите лучший роддом для родов"
        }
      ]
    },
    "vospitanie": {
      title: "Воспитание",
      icon: "users",
      description: "Советы по воспитанию детей",
      services: [
        {
          title: "Рассчитать дату родов",
          icon: "calculator",
          description: "Узнайте предполагаемую дату рождения"
        },
        {
          title: "Отзывы о роддомах",
          icon: "hospital",
          description: "Выберите лучший роддом для родов"
        }
      ]
    },
    "deti": {
      title: "Всё о детях",
      icon: "baby",
      description: "Здоровье, развитие и уход за детьми",
      services: [
        {
          title: "Рассчитать дату родов",
          icon: "calculator",
          description: "Узнайте предполагаемую дату рождения"
        },
        {
          title: "Отзывы о роддомах",
          icon: "hospital",
          description: "Выберите лучший роддом для родов"
        }
      ]
    },
    "stati": {
      title: "Полезные статьи",
      icon: "book",
      description: "Интересные и полезные статьи для мам",
      services: [
        {
          title: "Рассчитать дату родов",
          icon: "calculator",
          description: "Узнайте предполагаемую дату рождения"
        },
        {
          title: "Отзывы о роддомах",
          icon: "hospital",
          description: "Выберите лучший роддом для родов"
        }
      ]
    }
  };

  // Маппинг URL категорий на slug в базе данных
  const categorySlugMapping = {
    "zachatie": "zachatie",
    "beremennost": "beremennost", 
    "eko-mama": "eko-mama",        // URL eko-mama -> slug eko-mama
    "vospitanie": "vospitanie",
    "deti": "vsyo-o-detyah",       // URL deti -> slug vsyo-o-detyah
    "stati": "poleznye-stati"      // URL stati -> slug poleznye-stati
  };

  // Загрузка метаданных категории
  useEffect(() => {
    const foundCategory = categoryMetadata[categoryName];
    if (foundCategory) {
      setCategory(foundCategory);
      setLoading(false);
    } else {
      setError('Категория не найдена');
      setLoading(false);
    }
  }, [categoryName]);

  // Загрузка постов по категории
  useEffect(() => {
    if (categoryName && !loading) {
      fetchCategoryPosts();
    }
  }, [categoryName, loading]);

  // Загрузка постов категории с API
  const fetchCategoryPosts = async () => {
    setPostsLoading(true);
    try {
      // Получаем правильный slug для API из маппинга
      const apiCategorySlug = categorySlugMapping[categoryName];
      
      if (!apiCategorySlug) {
        console.error('Неизвестная категория:', categoryName);
        setPosts([]);
        setPostsLoading(false);
        return;
      }
      
      const response = await fetch(`/api/posts/?category=${apiCategorySlug}`);
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.results || []);
      } else {
        console.error('Ошибка загрузки постов категории:', response.status);
        setPosts([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки постов категории:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Обработчик клика по сервисам
  const handleServiceClick = (service) => {
    if (service.title === "Рассчитать дату родов") {
      navigate('/pregnancy-calculator');
    }
    // Здесь можно добавить другие сервисы
  };

  // Слайдер сервисов
  useEffect(() => {
    if (servicesSliderRef.current) {
      const slideWidth = 300; // 280px + 20px margin
      servicesSliderRef.current.style.transform = `translateX(-${currentServiceSlide * slideWidth}px)`;
    }
  }, [currentServiceSlide]);

  const nextServiceSlide = () => {
    if (category && currentServiceSlide < category.services.length - 1) {
      setCurrentServiceSlide(currentServiceSlide + 1);
    }
  };

  const prevServiceSlide = () => {
    if (currentServiceSlide > 0) {
      setCurrentServiceSlide(currentServiceSlide - 1);
    }
  };

  const goToServiceSlide = (index) => {
    setCurrentServiceSlide(index);
  };

  const getIcon = (iconName) => {
    const iconMap = {
      heart: faHeart,
      calendar: faCalendar,
      clipboard: faClipboard,
      stethoscope: faStethoscope,
      baby: faBaby,
      calculator: faCalculator,
      hospital: faHospital,
      users: faUsers,
      brain: faBrain,
      gamepad: faGamepad,
      book: faBookOpen,
      newspaper: faNewspaper
    };
    return iconMap[iconName] || faHeart;
  };

  const getCategoryIcon = (iconName) => {
    const iconMap = {
      heart: faHeart,
      baby: faBaby,
      users: faUsers,
      book: faBookOpen
    };
    return iconMap[iconName] || faHeart;
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Недавно';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Недавно';
      
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInMinutes < 1) return 'Только что';
      if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
      if (diffInHours < 24) return `${diffInHours} ч назад`;
      if (diffInDays < 7) return `${diffInDays} дн назад`;
      
      return date.toLocaleDateString('ru-RU');
    } catch (error) {
      return 'Недавно';
    }
  };

  if (loading) {
    return (
      <div className="category-page">
        <div className="loading-container">
          <div className="loading">Загрузка категории...</div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="category-page">
        <div className="error-container">
          <div className="error">
            <h2>Категория не найдена</h2>
            <p>Запрашиваемая категория не существует или была удалена.</p>
            <Link to="/" className="back-home-btn">Вернуться на главную</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-page">
      {/* Хлебные крошки */}
      <div className="breadcrumbs-container">
        <nav className="breadcrumbs">
          <Link to="/" className="breadcrumb-link">Главная</Link>
          <FontAwesomeIcon icon={faChevronRight} className="breadcrumb-separator" />
          <span className="breadcrumb-link active">{category.title}</span>
        </nav>
      </div>

      {/* Заголовок категории */}
      <div className="category-header">
        <h1 className="category-title">
          <FontAwesomeIcon 
            icon={getCategoryIcon(category.icon)} 
            className="category-icon"
          />
          {category.title}
        </h1>
        <p className="category-description">{category.description}</p>
      </div>

      {/* Полезные сервисы - Десктоп версия */}
      <div className="services-section">
        <div className="services-grid">
          {category.services.map((service, index) => (
            <div 
              key={index} 
              className="service-card"
              onClick={() => handleServiceClick(service)}
              style={{ cursor: 'pointer' }}
            >
              <div className="service-icon">
                <FontAwesomeIcon icon={getIcon(service.icon)} />
              </div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
            </div>
          ))}
        </div>

        {/* Полезные сервисы - Мобильная версия (слайдер) */}
        <div className="services-slider">
          <div className="services-slider-track" ref={servicesSliderRef}>
            {category.services.map((service, index) => (
              <div key={index} className="services-slider-slide">
                <div 
                  className="service-card"
                  onClick={() => handleServiceClick(service)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="service-icon">
                    <FontAwesomeIcon icon={getIcon(service.icon)} />
                  </div>
                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-description">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Навигационные кнопки */}
          <button 
            className="services-slider-btn prev" 
            onClick={prevServiceSlide}
            style={{ display: currentServiceSlide === 0 ? 'none' : 'flex' }}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button 
            className="services-slider-btn next" 
            onClick={nextServiceSlide}
            style={{ display: currentServiceSlide === category.services.length - 1 ? 'none' : 'flex' }}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
          
          {/* Индикаторы слайдов */}
          <div className="services-slider-indicators">
            {category.services.map((_, index) => (
              <button
                key={index}
                className={`services-indicator ${index === currentServiceSlide ? 'active' : ''}`}
                onClick={() => goToServiceSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Посты категории */}
      <div className="posts-section">
        <h2 className="posts-title">Посты в категории "{category.title}"</h2>
        
        {postsLoading ? (
          <div className="posts-loading">
            <div className="loading">Загрузка постов...</div>
          </div>
        ) : posts.length > 0 ? (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="author-info">
                    <div className="author-avatar">
                      {post.author?.avatar ? (
                        <img src={post.author.avatar} alt={post.author.username} />
                      ) : (
                        <div className="author-initials">
                          {post.author?.username ? post.author.username.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    <div className="author-details">
                      <div className="author-name">
                        {post.author?.username || 'Анонимный пользователь'}
                      </div>
                      <div className="post-meta">
                        <span className="post-time">
                          <FontAwesomeIcon icon={faCalendar} />
                          {formatDate(post.created_at)}
                        </span>
                        {post.author?.location && (
                          <span className="post-location">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            {post.author.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="post-options">
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </div>
                </div>
                
                <div className="post-content">
                  <h3 className="post-title">{post.title}</h3>
                  <div className="post-category">{post.category?.name || 'Без категории'}</div>
                  <p className="post-text">
                    {post.content?.length > 200 
                      ? `${post.content.substring(0, 200)}...` 
                      : post.content
                    }
                  </p>
                  <Link to={`/post/${post.slug}`} className="read-more">
                    Читать далее
                  </Link>
                </div>

                <div className="post-footer">
                  <div className="post-stats">
                    <span className="post-comments-btn">
                      <FontAwesomeIcon icon={faComment} />
                      {post.comments_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-posts">
            <div className="no-posts-icon">
              <FontAwesomeIcon icon={faNewspaper} />
            </div>
            <h3>Пока нет постов в этой категории</h3>
            <p>Будьте первым, кто поделится своим опытом!</p>
            <Link to="/create-post" className="create-post-btn">
              Создать пост
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
