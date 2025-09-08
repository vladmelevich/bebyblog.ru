// Утилиты для работы с аутентификацией

export const getAuthToken = () => {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
};

export const setAuthToken = (token, rememberMe = false) => {
  if (rememberMe) {
    localStorage.setItem('accessToken', token);
  } else {
    sessionStorage.setItem('accessToken', token);
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem('accessToken');
  sessionStorage.removeItem('accessToken');
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

export const refreshToken = async () => {
  const refreshTokenValue = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  
  if (!refreshTokenValue) {
    throw new Error('No refresh token found');
  }
  
  try {
    const response = await fetch('http://localhost:8000/api/auth/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshTokenValue
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      setAuthToken(data.access);
      return data.access;
    } else {
      throw new Error('Failed to refresh token');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

export const makeAuthenticatedRequest = async (url, options = {}) => {
  let token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  // Проверяем, не истек ли токен
  if (isTokenExpired(token)) {
    console.log('Token expired, refreshing...');
    try {
      token = await refreshToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Перенаправляем на страницу входа
      window.location.href = '/login';
      return;
    }
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
};

// Дополнительные функции для совместимости с существующим кодом

export const saveTokens = (accessToken, refreshToken, rememberMe = false) => {
  setAuthToken(accessToken, rememberMe);
  if (refreshToken) {
    if (rememberMe) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      sessionStorage.setItem('refreshToken', refreshToken);
    }
  }
};

export const removeTokens = () => {
  removeAuthToken();
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('userData');
};

export const checkTokenValidity = () => {
  const token = getAuthToken();
  return token && !isTokenExpired(token);
};

export const checkAuthOnLoad = () => {
  const token = getAuthToken();
  if (!token || isTokenExpired(token)) {
    removeTokens();
    return false;
  }
  return true;
};

export const getUserData = () => {
  const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
  if (userDataString) {
    try {
      return JSON.parse(userDataString);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

export const getUserIdFromToken = () => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id;
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};