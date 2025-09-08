import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faEyeSlash,
  faArrowLeft,
  faUser,
  faUserPlus,
  faCamera,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import './RegisterPage.css';
import { saveTokens } from '../../utils/auth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Данные первого этапа
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Данные второго этапа
  const [profileData, setProfileData] = useState({
    status: '',
    city: '',
    birthDate: '',
    avatar: null
  });

  // Состояния для показа/скрытия паролей
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData(prev => ({
        ...prev,
        avatar: file
      }));
    }
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      setError('Введите имя');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Введите фамилию');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Введите email');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Введите корректный email');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!profileData.status) {
      setError('Выберите ваш статус');
      return false;
    }
    if (!profileData.city.trim()) {
      setError('Введите город');
      return false;
    }
    if (!profileData.birthDate) {
      setError('Выберите дату рождения');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validateStep2()) {
      setIsLoading(false);
      return;
    }

    try {
      // Создаем FormData для отправки файла
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('username', formData.firstName.toLowerCase() + formData.lastName.toLowerCase());
      formDataToSend.append('first_name', formData.firstName);
      formDataToSend.append('last_name', formData.lastName);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('confirm_password', formData.confirmPassword);
      formDataToSend.append('status', profileData.status);
      formDataToSend.append('city', profileData.city);
      formDataToSend.append('birth_date', profileData.birthDate);
      
      // Добавляем аватар, если он есть
      if (profileData.avatar) {
        formDataToSend.append('avatar', profileData.avatar);
      }

      // Реальный запрос к API
      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        body: formDataToSend // Отправляем FormData вместо JSON
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Успешная регистрация
        console.log('Регистрация успешна:', data);
        console.log('Данные пользователя от сервера:', data.user);
        console.log('Аватар от сервера:', data.user.avatar);
        
        // Сохраняем данные пользователя в localStorage
        const userData = {
          id: data.user.id,
          email: formData.email,
          username: formData.firstName.toLowerCase() + formData.lastName.toLowerCase(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          status: profileData.status,
          city: profileData.city,
          birth_date: profileData.birthDate,
          avatar: data.user.avatar || null
        };
        console.log('Сохраняемые данные в localStorage:', userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Сохраняем токены
        saveTokens(data.access, data.refresh, false);
        
        // Обновляем состояние авторизации в Header
        window.dispatchEvent(new Event('authUpdate'));
        
        // Небольшая задержка для обновления Header
        setTimeout(() => {
          // Перенаправляем на страницу профиля пользователя
          navigate(`/profile/${data.user.id}`);
        }, 100);
      } else {
        // Ошибка от сервера
        setError(data.message || 'Ошибка при регистрации');
      }
      
    } catch (err) {
      setError('Ошибка при регистрации. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Кнопка "Назад" */}
        <Link to="/" className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Назад</span>
        </Link>

        {/* Прогресс-бар */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Основные данные</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Профиль</span>
          </div>
        </div>

        {/* Заголовок */}
        <div className="register-header">
          <div className="register-icon">
            <FontAwesomeIcon icon={step === 1 ? faUserPlus : faUser} />
          </div>
          <h1>{step === 1 ? 'Создать аккаунт' : 'Заполните профиль'}</h1>
          <p>
            {step === 1 
              ? 'Заполните основные данные для регистрации' 
              : 'Расскажите о себе, чтобы мы могли подобрать для вас подходящий контент'
            }
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Первый этап */}
        {step === 1 && (
          <form className="register-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Имя *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Введите ваше имя"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Фамилия *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Введите вашу фамилию"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Введите ваш email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль *</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Создайте пароль (минимум 6 символов)"
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Подтвердите пароль *</label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Повторите пароль"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>



            <button 
              type="button" 
              className="register-button"
              onClick={handleNextStep}
            >
              Перейти к следующему этапу
            </button>
          </form>
        )}

        {/* Второй этап */}
        {step === 2 && (
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="status">Ваш статус *</label>
              <select
                id="status"
                name="status"
                value={profileData.status}
                onChange={handleProfileChange}
                required
              >
                <option value="">Выберите статус</option>
                <option value="mom">Мама</option>
                <option value="pregnant">Беременная</option>
                <option value="planning">Планирую беременность</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="city">Город *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={profileData.city}
                  onChange={handleProfileChange}
                  placeholder="Введите ваш город"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">Дата рождения *</label>
              <div className="input-wrapper">
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={profileData.birthDate}
                  onChange={handleProfileChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="avatar">Фото профиля</label>
              <div className="avatar-upload">
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="avatar-input"
                />
                <label htmlFor="avatar" className="avatar-label">
                  <div className="avatar-preview">
                    {profileData.avatar ? (
                      <img 
                        src={URL.createObjectURL(profileData.avatar)} 
                        alt="Preview" 
                        className="avatar-image"
                      />
                    ) : (
                      <FontAwesomeIcon icon={faCamera} className="avatar-icon" />
                    )}
                  </div>
                  <span className="avatar-text">
                    {profileData.avatar ? 'Изменить фото' : 'Выбрать фото'}
                  </span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="back-button-step"
                onClick={handlePrevStep}
              >
                Назад
              </button>
              <button 
                type="submit" 
                className="register-button"
                disabled={isLoading}
              >
                {isLoading ? 'Создание аккаунта...' : 'Создать аккаунт'}
              </button>
            </div>
          </form>
        )}

        {/* Ссылка на вход */}
        <div className="register-footer">
          <p>
            Уже есть аккаунт?{' '}
            <Link to="/login" className="login-link">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
