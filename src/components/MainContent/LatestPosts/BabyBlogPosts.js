import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faMapMarkerAlt, faPen } from '@fortawesome/free-solid-svg-icons';
import './BabyBlogPosts.css';

const BebyBlogPosts = ({ limit = 4 }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let url = '/api/posts/';
      
      if (limit) {
        url += `?page_size=${limit}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const postsData = data.results || data;
        
        // Преобразуем данные в формат BebyBlog
        const transformedPosts = postsData.map((post, index) => {
          
          return {
            id: post.id,
            category: post.category?.name || 'Общее',
            title: post.title.length > 50 ? `${post.title.substring(0, 50)}...` : post.title,
            tag: post.category?.name || 'Общее',
            content: post.content || '',
            author: {
              id: post.author?.id || 1,
              name: post.author?.first_name && post.author?.last_name 
                ? `${post.author.first_name} ${post.author.last_name}`
                : post.author?.username || 'Автор',
              avatar: post.author?.avatar || null,
              location: post.author?.city || 'Москва',
              isOnline: Math.random() > 0.5 // Случайный статус онлайн
            },
            date: formatDate(post.published_at || post.created_at),
            slug: post.slug
          };
        });
        
        setPosts(transformedPosts);
      } else {
        setError('Ошибка загрузки постов');
      }
    } catch (error) {
      console.error('Ошибка загрузки постов:', error);
      setError('Ошибка загрузки постов');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) {
        return 'Недавно';
      }
      
      let date;
      
      // Проверяем, если дата в формате "DD.MM.YYYY"
      if (typeof dateString === 'string' && dateString.includes('.')) {
        const parts = dateString.split('.');
        if (parts.length === 3) {
          // Формат DD.MM.YYYY -> YYYY-MM-DD
          const [day, month, year] = parts;
          date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return 'Недавно';
      }
      
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      const diffInWeeks = Math.floor(diffInDays / 7);
      const diffInMonths = Math.floor(diffInDays / 30);
      
      if (diffInMinutes < 1) {
        return 'Только что';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} мин${diffInMinutes === 1 ? 'у' : diffInMinutes < 5 ? 'ы' : ''} назад`;
      } else if (diffInHours < 24) {
        return `${diffInHours} час${diffInHours === 1 ? '' : diffInHours < 5 ? 'а' : 'ов'} назад`;
      } else if (diffInDays < 7) {
        return `${diffInDays} дн${diffInDays === 1 ? 'ь' : diffInDays < 5 ? 'я' : 'ей'} назад`;
      } else if (diffInWeeks < 4) {
        return `${diffInWeeks} нед${diffInWeeks === 1 ? 'елю' : diffInWeeks < 5 ? 'ели' : 'ель'} назад`;
      } else if (diffInMonths < 12) {
        return `${diffInMonths} мес${diffInMonths === 1 ? 'яц' : diffInMonths < 5 ? 'яца' : 'яцев'} назад`;
      } else {
        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears} год${diffInYears === 1 ? '' : diffInYears < 5 ? 'а' : 'ов'} назад`;
      }
    } catch (error) {
      return 'Недавно';
    }
  };

  const getAuthorInitials = (authorName) => {
    if (!authorName) return 'А';
    const names = authorName.split(' ');
    return `${names[0]?.charAt(0) || 'А'}${names[1]?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="babyblog-posts-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка постов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="babyblog-posts-error">
        <p>{error}</p>
        <button onClick={fetchPosts} className="btn-retry">
          Попробовать снова
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
             <div className="babyblog-posts-empty">
         <div className="empty-icon">
           <FontAwesomeIcon icon={faPen} />
         </div>
        <h3>Постов пока нет</h3>
        <p>Будьте первым, кто поделится своими мыслями и опытом!</p>
        <Link to="/create-post" className="btn-create-post">
          <FontAwesomeIcon icon={faPen} />
          Написать первый пост
        </Link>
      </div>
    );
  }

  return (
    <div className="babyblog-posts-container">
      <div className="babyblog-posts-grid">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div className="author-info">
                <div className="author-avatar">
                  {post.author.avatar ? (
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="author-initials" style={{ 
                    display: post.author.avatar ? 'none' : 'flex' 
                  }}>
                    {getAuthorInitials(post.author.name)}
                  </div>
                </div>
                <div className="author-details">
                  <div className="author-name">{post.author.name}</div>
                  <div className="post-meta">
                    <span className="post-time">{post.date}</span>
                    <span className="post-location">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      {post.author.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="post-content">
              <h3 className="post-title">{post.title}</h3>
              <div className="post-category">{post.tag}</div>
              {post.content && (
                <p className="post-text">
                  {post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                </p>
              )}
              <Link to={`/post-detail/${post.slug}`} className="read-more">
                Читать далее
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BebyBlogPosts;
