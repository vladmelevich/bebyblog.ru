import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEyeSlash,
  faArrowLeft,
  faUser,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { saveTokens } from '../../utils/auth';
import { apiClient } from '../../utils/api';
import './AuthPage.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Имитация запроса к серверу
    try {
      // Используем apiClient для авторизации
      const response = await apiClient.login(email, password);
      console.log('Авторизация успешна:', response);
      console.log('Тип ответа:', typeof response);
      console.log('Ключи в ответе:', Object.keys(response || {}));
      console.log('response.id:', response.id);
      console.log('response.access_token:', response.access_token);
      
      // Проверяем, что ответ содержит данные пользователя
      if (!response || typeof response !== 'object') {
        console.error('Ошибка: неверный ответ сервера:', response);
        setError('Неверный ответ сервера');
        setIsLoading(false);
        return;
      }
      
      // Проверяем, что у нас есть ID пользователя
      if (!response.id) {
        console.error('Ошибка: response.id не определен:', response);
        console.error('Полный ответ:', JSON.stringify(response, null, 2));
        setError('Не удалось получить ID пользователя');
        setIsLoading(false);
        return;
      }
      
      console.log('ID пользователя получен:', response.id);
      
      const token = response.access_token || response.access;
      const refreshToken = response.refresh_token || response.refresh;
      
      if (token) {
        
        // Сохраняем токены с учетом "Запомнить меня"
        saveTokens(token, refreshToken, rememberMe);
        
        // Сохраняем данные пользователя для Header
        const nameParts = response.name?.split(' ') || [];
        const userData = {
          id: response.id,
          first_name: response.first_name || nameParts[0] || '',
          last_name: response.last_name || nameParts[1] || '',
          email: response.email,
          username: response.username || response.name,
          city: response.city || null,
          avatar: response.avatar || null,
          date_joined: response.date_joined || null,
          status: response.status || null,
          birth_date: response.birth_date || null
        };
        
        console.log('🔍 Полный ответ авторизации:', response);
        console.log('🔍 Аватар в ответе:', response.avatar);
        
        console.log('Сохраняемые данные пользователя:', userData);
        console.log('ID пользователя:', response.id);
        
        // Сохраняем данные пользователя в зависимости от "Запомнить меня"
        if (rememberMe) {
          localStorage.setItem('userData', JSON.stringify(userData));
        } else {
          sessionStorage.setItem('userData', JSON.stringify(userData));
        }
        
        // Обновляем состояние авторизации в Header
        window.dispatchEvent(new Event('authUpdate'));
        
        // Небольшая задержка для обновления Header, затем перенаправляем на профиль
        setTimeout(() => {
          navigate(`/profile/${response.id}`);
        }, 100);
      } else {
        setError('Не удалось получить токен авторизации');
      }
      
    } catch (err) {
      console.error('Ошибка авторизации:', err);
      console.error('Тип ошибки:', typeof err);
      console.error('Сообщение ошибки:', err.message);
      setError(err.message || 'Ошибка при авторизации. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Кнопка "Назад" */}
        <Link to="/" className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Назад</span>
        </Link>

        {/* Заголовок */}
        <div className="auth-header">
          <div className="auth-icon">
            <FontAwesomeIcon icon={faUser} />
          </div>
          <h1>Войти в аккаунт</h1>
          <p>Добро пожаловать обратно! Войдите в свой аккаунт</p>
        </div>

        {/* Форма авторизации */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Email поле */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите ваш email"
                required
              />
            </div>
          </div>

          {/* Пароль поле */}
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите ваш пароль"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* Запомнить меня и Забыли пароль */}
          <div className="auth-options">
            <div className="remember-me">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom">
                  {rememberMe && <FontAwesomeIcon icon={faCheck} />}
                </span>
                <span className="checkbox-text">Запомнить меня</span>
              </label>
            </div>
            
            <div className="forgot-password">
              <Link to="/forgot-password">Забыли пароль?</Link>
            </div>
          </div>

          {/* Кнопка входа */}
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {/* Разделитель */}
        <div className="auth-divider">
          <span>или</span>
        </div>

        {/* Ссылка на регистрацию */}
        <div className="auth-footer">
          <p>
            Нет аккаунта?{' '}
            <Link to="/register" className="register-link">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
