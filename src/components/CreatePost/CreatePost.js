import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faEye } from '@fortawesome/free-solid-svg-icons';
import { apiClient } from '../../utils/api.js';
import { getApiUrl } from '../../config/api';
import { removeTokens, checkTokenValidity, getUserData, getUserIdFromToken } from '../../utils/auth.js';
import SimpleCategories from './SimpleCategories';
import './CreatePost.css';

const CreatePost = () => {
  const navigate = useNavigate();
  // Категории теперь встроены в JSX - состояние не нужно
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    content: '',
    category: '',
    status: 'draft'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await checkTokenValidity();
      if (!isValid) {
        removeTokens();
        navigate('/auth');
        return;
      }
      // Категории теперь встроены в JSX - загрузка не нужна
    };
    
    checkAuth();
  }, [navigate]);

  // Категории теперь встроены прямо в JSX - функция не нужна

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку для этого поля
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Заголовок обязателен';
    }
    
    if (!formData.short_description.trim()) {
      newErrors.short_description = 'Краткое описание обязательно';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Содержание обязательно';
    }
    
    if (!formData.category) {
      newErrors.category = 'Выберите категорию';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Передаем обычный объект, FormData создается в apiClient
      const postData = {
        title: formData.title,
        short_description: formData.short_description,
        content: formData.content,
        category: formData.category,
        status: formData.status
      };

      console.log('Отправляемые данные поста:', postData);
      const data = await apiClient.createPost(postData);
      console.log('Ответ сервера при создании поста:', data);
      console.log('Статус созданного поста:', data.post?.status);
        
        // Если это черновик, перенаправляем на профиль
        if (formData.status === 'draft') {
          const userData = getUserData();
          const userId = userData?.id || getUserIdFromToken() || 1;
          console.log('Перенаправление на профиль пользователя:', userId);
          navigate(`/profile/${userId}`);
        } else {
          // Если опубликованный пост, перенаправляем на детали поста
          navigate(`/post-detail/${data.post.slug}`);
        }
    } catch (error) {
      console.error('Ошибка создания поста:', error);
      
      if (error.message.includes('авторизация') || error.message.includes('401') || error.message.includes('Учетные данные не были предоставлены')) {
        console.log('Ошибка авторизации, перенаправляем на страницу входа');
        removeTokens();
        navigate('/auth');
      } else {
        // Обрабатываем различные типы ошибок
        let errorMessage = 'Не удалось создать пост. Проверьте все поля и попробуйте снова.';
        
        if (error.message.includes('title')) {
          errorMessage = 'Ошибка в заголовке поста';
        } else if (error.message.includes('content')) {
          errorMessage = 'Ошибка в содержании поста';
        } else if (error.message.includes('category')) {
          errorMessage = 'Ошибка в категории поста';
        }
        
        setErrors({ submit: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
      <div className="create-post-container">
        <div className="create-post-header">
          <h1>Создать новый пост</h1>
          <p>Поделитесь своими мыслями и опытом с другими мамами</p>
        </div>
        
        {/* Кнопка для принудительного входа при проблемах с авторизацией */}
        {errors.submit && errors.submit.includes('Учетные данные') && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
            <p style={{ margin: '0 0 10px 0', color: '#721c24' }}>
              Проблема с авторизацией. Попробуйте войти заново:
            </p>
            <button 
              onClick={() => {
                removeTokens();
                navigate('/auth');
              }}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Войти заново
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="create-post-form">
          {/* Основная информация */}
          <div className="form-section">
            <h3>Основная информация</h3>
            
            <div className="form-group">
              <label htmlFor="title">Заголовок *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Введите заголовок поста"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="short_description">Краткое описание (1-2 слова) *</label>
              <input
                type="text"
                id="short_description"
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                placeholder="Например: Прикорм, Сон, Игры"
                className={errors.short_description ? 'error' : ''}
              />
              {errors.short_description && <span className="error-message">{errors.short_description}</span>}
            </div>
            
            <div className="form-group">
              <SimpleCategories />
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="content">Содержание *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Напишите содержание вашего поста..."
                rows="10"
                className={errors.content ? 'error' : ''}
              />
              {errors.content && <span className="error-message">{errors.content}</span>}
            </div>
          </div>
          
          {/* Настройки */}
          <div className="form-section">
            <h3>Настройки</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Статус публикации</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликовать</option>
                </select>
              </div>
              

            </div>
          </div>
          
          {/* Общая ошибка */}
          {errors.submit && (
            <div className="form-error">
              <span className="error-message">{errors.submit}</span>
            </div>
          )}
          
          {/* Кнопки */}
          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={loading}>
              <FontAwesomeIcon icon={faSave} />
              {loading ? 'Создание...' : 'Создать пост'}
            </button>
            
            <button type="button" className="btn-preview" onClick={() => navigate('/')}>
              <FontAwesomeIcon icon={faEye} />
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
