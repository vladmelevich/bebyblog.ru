import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProfileUrl } from '../../utils/profile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faMapMarkerAlt, 
  faCalendar, 
  faShare,
  faEdit,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import DeleteConfirmModal from './DeleteConfirmModal';
import ShareModal from './ShareModal';
import './PostDetail.css';

const PostDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Вспомогательные функции
  const getAuthorInitials = (author) => {
    if (!author) return 'А';
    const firstName = author.first_name || '';
    const lastName = author.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'А';
  };

  const getUserAvatarUrl = (userData) => {
    // Сначала проверяем avatar_url, потом avatar, потом тестовую аватарку
    if (userData.avatar_url) return userData.avatar_url;
    if (userData.avatar) return userData.avatar;
    // Создаем тестовую аватарку с инициалами пользователя
    const initials = getAuthorInitials(userData);
    return `https://via.placeholder.com/40x40/667eea/ffffff?text=${encodeURIComponent(initials)}`;
  };

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      
      // Получаем токен авторизации
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:8000/api/posts/${slug}/`, {
        headers: headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setPost(data);
      } else {
        console.error('Ошибка получения поста:', response.status, response.statusText);
        setError('Пост не найден');
      }
    } catch (error) {
      console.error('Ошибка загрузки поста:', error);
      setError('Ошибка загрузки поста');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    // Проверяем slug перед выполнением любых действий
    const problematicSlugs = ['post', 'api', 'admin', 'static', 'media', 'login', 'register', 'logout', 'create', 'edit', 'delete'];
    
    if (slug && 
        slug.trim() !== '' && 
        !problematicSlugs.includes(slug)) {
      fetchPost();
    } else {
      setError('Неверный адрес страницы');
      setLoading(false);
    }
  }, [slug, fetchPost]);


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

  const getAuthorName = (author) => {
    if (!author) return 'Автор';
    const firstName = author.first_name || '';
    const lastName = author.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || author.username || 'Автор';
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      
      // Получаем данные текущего пользователя
      const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
      
      // Проверяем, есть ли данные пользователя
      if (!userData.id || !userData.first_name || !userData.last_name) {
        console.error('Данные пользователя не найдены:', userData);
        setError('Ошибка: данные пользователя не найдены. Попробуйте перезайти в аккаунт.');
        return;
      }
      
      console.log('Данные пользователя из localStorage:', userData); // Для отладки
      
      // Создаем новый комментарий локально для демонстрации
      const newCommentObj = {
        id: Date.now(), // Временный ID
        content: newComment,
        author: {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.username,
          avatar: userData.avatar || null,
          avatar_url: getUserAvatarUrl(userData),
          city: userData.city || "Москва"
        },
        created_at: new Date().toISOString(),
        parent: null,
        is_approved: true
      };
      
      console.log('Новый комментарий:', newCommentObj); // Для отладки

      // Добавляем комментарий в начало массива, чтобы он отображался первым
      setPost(prev => ({
        ...prev,
        comments: [newCommentObj, ...(prev.comments || [])]
      }));
      
      setNewComment('');
      
      // Попытка отправить на сервер (если работает)
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (token) {
          const response = await fetch(`http://localhost:8000/api/posts/${slug}/comments/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: newComment,
              parent: null
            })
          });

          if (response.ok) {
            console.log('Комментарий успешно отправлен на сервер');
          } else {
            console.log('Ошибка отправки на сервер, но комментарий добавлен локально');
          }
        }
      } catch (serverError) {
        console.log('Сервер недоступен, комментарий добавлен локально');
      }
    } catch (error) {
      console.error('Ошибка при отправке комментария:', error);
      setError('Ошибка при отправке комментария');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      
      // Получаем данные текущего пользователя
      const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
      
      // Проверяем, есть ли данные пользователя
      if (!userData.id || !userData.first_name || !userData.last_name) {
        console.error('Данные пользователя не найдены:', userData);
        setError('Ошибка: данные пользователя не найдены. Попробуйте перезайти в аккаунт.');
        return;
      }
      
      // Создаем новый ответ локально для демонстрации
      const newReplyObj = {
        id: Date.now(), // Временный ID
        content: replyText,
        author: {
          id: userData.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.username,
          avatar: userData.avatar || null,
          avatar_url: getUserAvatarUrl(userData),
          city: userData.city || "Москва"
        },
        created_at: new Date().toISOString(),
        parent: parentId,
        is_approved: true
      };

      // Добавляем ответ к посту
      setPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newReplyObj]
      }));
      
      setReplyText('');
      setReplyTo(null);
      
      // Попытка отправить на сервер (если работает)
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (token) {
          const response = await fetch(`http://localhost:8000/api/posts/${slug}/comments/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: replyText,
              parent: parentId
            })
          });

          if (response.ok) {
            console.log('Ответ успешно отправлен на сервер');
          } else {
            console.log('Ошибка отправки на сервер, но ответ добавлен локально');
          }
        }
      } catch (serverError) {
        console.log('Сервер недоступен, ответ добавлен локально');
      }
    } catch (error) {
      console.error('Ошибка при отправке ответа:', error);
      setError('Ошибка при отправке ответа');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyClick = (commentId) => {
    setReplyTo(replyTo === commentId ? null : commentId);
    setReplyText('');
  };

  const handleEditPost = () => {
    if (post && post.slug) {
      navigate(`/edit-post/${post.slug}`);
    }
  };

  const handleDeletePost = () => {
    if (!post || !post.slug) {
      setError('Ошибка: пост не найден');
      return;
    }
    setShowDeleteModal(true);
  };

  const handleSharePost = () => {
    setShowShareModal(true);
  };

  const confirmDeletePost = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/posts/${post.slug}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        navigate('/');
      } else {
        setError('Ошибка при удалении поста');
      }
    } catch (error) {
      console.error('Ошибка при удалении поста:', error);
      setError('Ошибка при удалении поста');
    }
  };

  const handleDeleteComment = async (commentId) => {
    // Добавляем класс для анимации удаления
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (commentElement) {
      commentElement.classList.add('deleting');
    }

    // Удаляем комментарий через небольшую задержку для анимации
    setTimeout(() => {
      setPost(prev => ({
        ...prev,
        comments: prev.comments.filter(comment => comment.id !== commentId && comment.parent !== commentId)
      }));
    }, 300);

    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (token) {
        const response = await fetch(`http://localhost:8000/api/posts/comments/${commentId}/delete/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log('Комментарий успешно удален на сервере');
        } else {
          console.log('Ошибка удаления комментария на сервере, но удален локально');
        }
      }
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
      // Комментарий уже удален локально, так что ничего не делаем
    }
  };

  const isLoggedIn = () => {
    return !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'));
  };

  const isAuthor = () => {
    if (!post || !isLoggedIn()) return false;
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
      return userData.id === post.author?.id;
    } catch (error) {
      console.error('Ошибка при парсинге данных пользователя:', error);
      return false;
    }
  };

  const isMyComment = (comment) => {
    try {
      // Получаем данные текущего пользователя
      const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || '{}');
      return comment.author?.id === userData.id;
    } catch (error) {
      console.error('Ошибка при парсинге данных пользователя:', error);
      return false;
    }
  };



  if (loading) {
    return (
      <div className="post-detail-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка поста...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-error">
        <h2>Ошибка</h2>
        <p>{error || 'Пост не найден'}</p>
        <button onClick={() => navigate('/')} className="btn-back">
          <FontAwesomeIcon icon={faArrowLeft} />
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      {/* Кнопка назад */}
      <div className="post-detail-header">
        <button onClick={() => navigate('/')} className="btn-back">
          <FontAwesomeIcon icon={faArrowLeft} />
          Назад
        </button>
      </div>

      {/* Основной контент */}
      <div className="post-detail-content">
        <article className="post-article">
          {/* Информация об авторе */}
          <div className="post-author-section">
            <div className="author-info">
              <div 
                className="author-avatar clickable"
                onClick={() => navigate(getProfileUrl(post.author.id))}
                title="Перейти к профилю"
              >
                {post.author?.avatar_url ? (
                  <img 
                    src={post.author.avatar_url} 
                    alt={getAuthorName(post.author)}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="author-initials" style={{ 
                  display: post.author?.avatar_url ? 'none' : 'flex' 
                }}>
                  {getAuthorInitials(post.author)}
                </div>
              </div>
              
              <div className="author-details">
                              <div 
                className="author-name clickable"
                onClick={() => navigate(getProfileUrl(post.author.id))}
                title="Перейти к профилю"
              >
                  {getAuthorName(post.author)}
                </div>
                <div className="author-meta">
                  <span className="author-location">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    {post.author?.city || 'Москва'}
                  </span>
                  <span className="post-date">
                    <FontAwesomeIcon icon={faCalendar} />
                    {formatDate(post.published_at || post.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Заголовок статьи */}
          <div className="post-title-section">
            <div className="post-title-header">
              <div className="post-title-content">
                <div className="post-category-display" data-category={post.category?.name || 'Общее'}>
                  {post.status === 'draft' && (
                    <span className="draft-badge">Черновик</span>
                  )}
                </div>
                <h1 className="post-title">{post.title}</h1>
              </div>
              
                              {/* Кнопки действий */}
                <div className="post-actions-header">
                  {isAuthor() && (
                    <>
                      <button 
                        className="action-btn edit-btn"
                        onClick={handleEditPost}
                        title="Редактировать пост"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={handleDeletePost}
                        title="Удалить пост"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </>
                  )}
                  <button className="action-btn share-btn" onClick={handleSharePost} title="Поделиться постом">
                    <FontAwesomeIcon icon={faShare} />
                  </button>
                </div>
            </div>
          </div>

           {/* Основной контент */}
           <div className="post-body">
             <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
           </div>

          {/* SEO информация (только для автора) */}
          {(() => {
            try {
              const userData = JSON.parse(localStorage.getItem('userData') || '{}');
              return post.author?.id === userData.id;
            } catch (error) {
              return false;
            }
          })() && (
            <div className="post-seo-info">
              <h3>SEO информация</h3>
              <div className="seo-fields">
                <div className="seo-field">
                  <label>Meta Title:</label>
                  <p>{post.meta_title}</p>
                </div>
                
                <div className="seo-field">
                  <label>Meta Description:</label>
                  <p>{post.meta_description}</p>
                </div>
                
                <div className="seo-field">
                  <label>Meta Keywords:</label>
                  <p>{post.meta_keywords}</p>
                </div>
              </div>
            </div>
          )}

                     {/* Комментарии */}
          {(post.comments_enabled === 'enabled' || post.comments_enabled === undefined) && (
            <div className="post-comments">
              <h3>Комментарии ({post.comments?.length || 0})</h3>
               
               {/* Отображение ошибок */}
               {error && (
                 <div className="error-message">
                   {error}
                 </div>
               )}
               
                               {/* Форма добавления комментария */}
                {isLoggedIn() ? (
                 <form onSubmit={handleSubmitComment} className="comment-form">
                   <div className="comment-input-wrapper">
                     <textarea
                       value={newComment}
                       onChange={(e) => setNewComment(e.target.value)}
                       placeholder="Написать комментарий..."
                       className="comment-input"
                       rows="3"
                       disabled={submitting}
                     />
                   </div>
                   <div className="comment-form-actions">
                     <button 
                       type="submit" 
                       className="btn-submit-comment"
                       disabled={!newComment.trim() || submitting}
                     >
                       {submitting ? 'Отправка...' : 'Отправить'}
                     </button>
                   </div>
                 </form>
               ) : (
                 <div className="comment-login-prompt">
                   <p>Чтобы оставить комментарий, пожалуйста, <Link to="/auth">войдите в систему</Link></p>
                 </div>
               )}

               {/* Список комментариев */}
               {post.comments && post.comments.length > 0 ? (
                 <div className="comments-list">
                   {post.comments
                     .filter(comment => !comment.parent) // Только основные комментарии
                     .map(comment => (
                       <div key={comment.id} className="comment" data-comment-id={comment.id}>
                                                   <div className="comment-author">
                            <div 
                              className="comment-avatar clickable"
                              onClick={() => navigate(getProfileUrl(comment.author.id))}
                              title="Перейти к профилю"
                            >
                              {comment.author?.avatar_url ? (
                                <img 
                                  src={comment.author.avatar_url} 
                                  alt={getAuthorName(comment.author)}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="comment-initials" style={{ 
                                display: comment.author?.avatar_url ? 'none' : 'flex' 
                              }}>
                                {getAuthorInitials(comment.author)}
                              </div>
                            </div>
                            <div className="comment-info">
                              <div 
                                className="comment-author-name clickable"
                                onClick={() => navigate(getProfileUrl(comment.author.id))}
                                title="Перейти к профилю"
                              >
                                {getAuthorName(comment.author)}
                              </div>
                              <div className="comment-author-location">
                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                                {comment.author?.city || 'Москва'}
                              </div>
                              <div className="comment-date">
                                {formatDate(comment.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="comment-content">{comment.content}</div>
                          
                          {/* Кнопки действий */}
                          <div className="comment-actions">
                            {isLoggedIn() && (
                              <button 
                                onClick={() => handleReplyClick(comment.id)}
                                className="btn-reply"
                              >
                                Ответить
                              </button>
                            )}
                            {isMyComment(comment) && (
                              <button 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="btn-delete"
                              >
                                Удалить
                              </button>
                            )}
                          </div>

                         {/* Форма ответа */}
                         {replyTo === comment.id && (
                           <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="reply-form">
                             <div className="comment-input-wrapper">
                               <textarea
                                 value={replyText}
                                 onChange={(e) => setReplyText(e.target.value)}
                                 placeholder="Написать ответ..."
                                 className="comment-input"
                                 rows="2"
                                 disabled={submitting}
                               />
                             </div>
                             <div className="comment-form-actions">
                               <button 
                                 type="submit" 
                                 className="btn-submit-comment"
                                 disabled={!replyText.trim() || submitting}
                               >
                                 {submitting ? 'Отправка...' : 'Отправить'}
                               </button>
                               <button 
                                 type="button" 
                                 onClick={() => setReplyTo(null)}
                                 className="btn-cancel"
                               >
                                 Отмена
                               </button>
                             </div>
                           </form>
                         )}

                         {/* Ответы на комментарий */}
                         {post.comments
                           .filter(reply => reply.parent === comment.id)
                           .map(reply => (
                                                           <div key={reply.id} className="comment reply" data-comment-id={reply.id}>
                                <div className="comment-author">
                                  <div 
                                    className="comment-avatar clickable"
                                    onClick={() => navigate(getProfileUrl(reply.author.id))}
                                    title="Перейти к профилю"
                                  >
                                    {reply.author?.avatar_url ? (
                                      <img 
                                        src={reply.author.avatar_url} 
                                        alt={getAuthorName(reply.author)}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className="comment-initials" style={{ 
                                      display: reply.author?.avatar_url ? 'none' : 'flex' 
                                    }}>
                                      {getAuthorInitials(reply.author)}
                                    </div>
                                  </div>
                                  <div className="comment-info">
                                                                                                          <div 
                                      className="comment-author-name clickable"
                                      onClick={() => navigate(getProfileUrl(reply.author.id))}
                                      title="Перейти к профилю"
                                    >
                                    {getAuthorName(reply.author)}
                                  </div>
                                    <div className="comment-author-location">
                                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                                      {reply.author?.city || 'Москва'}
                                    </div>
                                    <div className="comment-date">
                                      {formatDate(reply.created_at)}
                                    </div>
                                  </div>
                                </div>
                                <div className="comment-content">{reply.content}</div>
                                {isMyComment(reply) && (
                                  <div className="comment-actions">
                                    <button 
                                      onClick={() => handleDeleteComment(reply.id)}
                                      className="btn-delete"
                                    >
                                      Удалить
                                    </button>
                                  </div>
                                )}
                              </div>
                           ))}
                       </div>
                     ))}
                 </div>
               ) : (
                 <p className="no-comments">Пока нет комментариев. Будьте первым!</p>
               )}
             </div>
           )}
        </article>

                 {/* Боковая панель */}
         <aside className="post-sidebar">
           <div className="sidebar-section">
             <h3>Информация о посте</h3>
             <div className="post-info">
               <div className="info-item">
                 <span className="info-label">Статус:</span>
                 <span className={`info-value status-${post.status}`}>
                   {post.status === 'published' ? 'Опубликован' : 'Черновик'}
                 </span>
               </div>
               <div className="info-item">
                 <span className="info-label">Комментарии:</span>
                 <span className="info-value">
                   {post.comments_enabled === 'enabled' || post.comments_enabled === undefined ? 'Разрешены' : 'Запрещены'}
                 </span>
               </div>
               <div className="info-item">
                 <span className="info-label">Дата создания:</span>
                 <span className="info-value">
                   {new Date(post.created_at).toLocaleDateString('ru-RU')}
                 </span>
               </div>
               {post.published_at && (
                 <div className="info-item">
                   <span className="info-label">Дата публикации:</span>
                   <span className="info-value">
                     {new Date(post.published_at).toLocaleDateString('ru-RU')}
                   </span>
                 </div>
               )}
             </div>
           </div>
           
                       {/* Краткое описание */}
            {post.short_description && (
              <div className="sidebar-section">
                <h3>Краткое описание</h3>
                <div className="post-short-description">
                  <p>{post.short_description}</p>
                </div>
              </div>
            )}
            

         </aside>
      </div>
      
      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeletePost}
        postTitle={post?.title || ''}
      />

             {/* Модальное окно для поделиться постом */}
       <ShareModal
         isOpen={showShareModal}
         onClose={() => setShowShareModal(false)}
         post={post}
       />
    </div>
  );
};

export default PostDetail;


