// Утилиты для работы с профилями

// Получить правильный URL профиля
export const getProfileUrl = (authorId) => {
  const currentUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  
  if (currentUserData) {
    const currentUser = JSON.parse(currentUserData);
    
    // Если это профиль текущего пользователя
    if (currentUser.id == authorId) {
      return `/profile/${authorId}`;
    }
  }
  
  // Если это профиль другого пользователя
  return `/user/${authorId}`;
};















