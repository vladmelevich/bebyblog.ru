import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditPost.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getApiUrl } from '../../config/api';
import { 
  faArrowLeft, 
  faSave, 
  faEye,
  faEyeSlash,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

const EditPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchPostData();
    fetchCategories();
  }, [slug]);

  const fetchPostData = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      if (!token) {
        setError('Необходима авторизация');
        return;
      }

      const response = await fetch(`getApiUrl('')/posts/${slug}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const postData = await response.json();
        setFormData({
          title: postData.title || '',
          content: postData.content || '',
          category: postData.category?.id || '',
          status: postData.status || 'draft'
        });
      } else {
        setError('Пост не найден или у вас нет прав для его редактирования');
      }
    } catch (error) {
      console.error('Ошибка загрузки поста:', error);
      setError('Ошибка загрузки поста');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('getApiUrl('')/posts/categories/');
      if (response.ok) {
        const categoriesData = await response.json();
        console.log('Загруженные категории:', categoriesData);
        // Убеждаемся, что categoriesData - это массив
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else if (categoriesData.results && Array.isArray(categoriesData.results)) {
          setCategories(categoriesData.results);
        } else {
          console.error('Неожиданный формат данных категорий:', categoriesData);
          setCategories([]);
        }
      } else {
        console.error('Ошибка загрузки категорий:', response.status);
        setCategories([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий, используем статические:', error);
      // Используем статические категории как fallback
      const staticCategories = [
        { id: 1, name: 'Зачатие' },
        { id: 2, name: 'Беременность' },
        { id: 3, name: 'ЭКО-мама' },
        { id: 4, name: 'Воспитание' },
        { id: 5, name: 'Всё о детях' },
        { id: 6, name: 'Полезные статьи' }
      ];
      setCategories(staticCategories);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      if (!token) {
        setError('Необходима авторизация');
        return;
      }

      const submitData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        status: formData.status
      };

      const response = await fetch(`getApiUrl('')/posts/${slug}/edit/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Пост успешно обновлен:', data);
        
        // Перенаправляем на страницу поста или профиль
        if (formData.status === 'published') {
          navigate(`/post-detail/${data.post.slug}`);
        } else {
          // Получаем ID пользователя из токена или данных
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          const userId = userData.id || 1;
          navigate(`/profile/${userId}`);
        }
      } else {
        const errorData = await response.json();
        console.error('Ошибка обновления поста:', errorData);
        setError(errorData.error || 'Ошибка при обновлении поста');
      }
    } catch (error) {
      console.error('Ошибка при обновлении поста:', error);
      setError('Ошибка при обновлении поста');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-post-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка поста...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-post-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="btn-back">
          <FontAwesomeIcon icon={faArrowLeft} />
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="edit-post-page">
      <div className="edit-post-container">
        {/* Заголовок */}
        <div className="edit-post-header">
          <button onClick={() => navigate(-1)} className="btn-back">
            <FontAwesomeIcon icon={faArrowLeft} />
            Назад
          </button>
          <h1>Редактировать пост</h1>
        </div>

        {/* Форма редактирования */}
        <form onSubmit={handleSubmit} className="edit-post-form">
          {/* Заголовок поста */}
          <div className="form-group">
            <label htmlFor="title">Заголовок *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Введите заголовок поста"
            />
          </div>

          {/* Категория */}
          <div className="form-group">
            <label htmlFor="category">Категория *</label>
                         <select
               id="category"
               name="category"
               value={formData.category}
               onChange={handleInputChange}
               required
             >
               <option value="">Выберите категорию</option>
               {Array.isArray(categories) && categories.map(category => (
                 <option key={category.id} value={category.id}>
                   {category.name}
                 </option>
               ))}
             </select>
          </div>

          {/* Содержание */}
          <div className="form-group">
            <label htmlFor="content">Содержание *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              placeholder="Напишите содержание вашего поста..."
              rows="10"
            />
          </div>

                     

          {/* Статус */}
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

          {/* Кнопки */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-save"
              disabled={saving}
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Сохранение...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  Сохранить
                </>
              )}
            </button>
            
            <button 
              type="button" 
              className="btn-preview"
              onClick={() => navigate(`/post-detail/${slug}`)}
            >
              <FontAwesomeIcon icon={faEye} />
              Предварительный просмотр
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPost;
