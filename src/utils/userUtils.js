// Утилита для работы с пользователями
import { getApiUrl } from '../config/api';

// Получить информацию о пользователе по ID
export const getUserInfo = async (userId) => {
  try {
    // Делаем API-запрос для получения реальных данных
    // Используем тот же endpoint, что и в UserProfilePage
    const response = await fetch(getApiUrl(`/users/profile-with-posts/${userId}/`), {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.user) {
        const user = data.user;
        const userInfo = {
          id: userId,
          name: user.first_name || user.username || `Пользователь ${userId}`,
          avatar: user.avatar || null,
          city: user.city || 'Не указан'
        };
        
        return userInfo;
      } else if (data.user) {
        // Если нет поля success, но есть user
        const user = data.user;
        const userInfo = {
          id: userId,
          name: user.first_name || user.username || `Пользователь ${userId}`,
          avatar: user.avatar || null,
          city: user.city || 'Не указан'
        };
        
        return userInfo;
      }
    }
    
    // Если API не сработал, возвращаем базовую информацию
    const basicUserInfo = {
      id: userId,
      name: `Пользователь ${userId}`,
      avatar: null,
      city: 'Не указан'
    };
    
    return basicUserInfo;
  } catch (error) {
    console.error('Ошибка при получении информации о пользователе:', error);
    const basicUserInfo = {
      id: userId,
      name: `Пользователь ${userId}`,
      avatar: null,
      city: 'Не указан'
    };
    return basicUserInfo;
  }
};

// Получить инициалы пользователя
export const getUserInitials = (userName) => {
  if (!userName) return 'А';
  const names = userName.split(' ');
  return `${names[0]?.charAt(0) || 'А'}${names[1]?.charAt(0) || ''}`.toUpperCase();
};

// Форматировать дату
export const formatDate = (dateString) => {
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
