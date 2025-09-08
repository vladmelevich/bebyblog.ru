import { getAuthToken, isTokenExpired, refreshToken } from './auth';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  setToken(token) {
    // Токен теперь управляется через auth.js
    console.log('Token set via auth.js');
  }

  getHeaders(includeContentType = true) {
    const headers = {};
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    const token = getAuthToken();
    if (token && !isTokenExpired(token)) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Метод для запросов без авторизации (например, login, register)
  async requestWithoutAuth(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Определяем, нужно ли включать Content-Type
    const isFormData = options.body instanceof FormData;
    const config = {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      console.log('Raw response status:', response.status);
      console.log('Raw response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorData: errorData
        });
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Response data:', responseData);
      return responseData;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Получаем актуальный токен
    let token = getAuthToken();
    console.log('Текущий токен:', token ? 'есть' : 'нет');
    
    // Проверяем, не истек ли токен
    if (token && isTokenExpired(token)) {
      console.log('Токен истек, пытаемся обновить...');
      try {
        token = await refreshToken();
        console.log('Токен обновлен успешно');
      } catch (error) {
        console.error('Failed to refresh token:', error);
        throw new Error('Учетные данные не были предоставлены.');
      }
    }
    
    if (!token) {
      console.error('Токен отсутствует, перенаправляем на авторизацию');
      throw new Error('Учетные данные не были предоставлены.');
    }
    
    // Определяем, нужно ли включать Content-Type
    const isFormData = options.body instanceof FormData;
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      console.log('Raw response status:', response.status);
      console.log('Raw response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorData: errorData
        });
        throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Response data:', responseData);
      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Аутентификация
  async register(userData) {
    return this.requestWithoutAuth('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: `${userData.firstName} ${userData.lastName} ${Date.now()}`,
        city: userData.city || '',
        avatar: null
      }),
    });
  }

  async login(email, password) {
    return this.requestWithoutAuth('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        password: password
      }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me/');
  }

  // Пользователи
  async getUsers() {
    return this.request('/users');
  }

  // Чаты
  async getChats() {
    return this.request('/chats');
  }

  async createChat(user2Id) {
    return this.request('/chats', {
      method: 'POST',
      body: JSON.stringify({ user2_id: user2Id }),
    });
  }

  // Сообщения
  async getMessages(chatId) {
    return this.request(`/chats/${chatId}/messages`);
  }

  async sendMessage(chatId, text) {
    return this.request(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async updateMessage(messageId, text) {
    return this.request(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ text }),
    });
  }

  async deleteMessage(messageId) {
    return this.request(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async uploadFile(messageId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request(`/messages/${messageId}/files`, {
      method: 'POST',
      body: formData,
    });
  }

  // Методы для постов (совместимость со старым API)
  async createPost(postData) {
    console.log('apiClient.createPost получил данные:', postData);
    
    const formData = new FormData();
    
    // Добавляем все поля в FormData
    Object.keys(postData).forEach(key => {
      if (postData[key] !== null && postData[key] !== undefined) {
        console.log(`Добавляем в FormData: ${key} = ${postData[key]}`);
        formData.append(key, postData[key]);
      }
    });
    
    console.log('FormData создан, отправляем запрос');
    
    return this.request('/posts/create/', {
      method: 'POST',
      body: formData,
    });
  }

  async updatePost(postId, postData) {
    const formData = new FormData();
    
    Object.keys(postData).forEach(key => {
      if (postData[key] !== null && postData[key] !== undefined) {
        formData.append(key, postData[key]);
      }
    });
    
    return this.request(`/posts/${postId}/update/`, {
      method: 'PUT',
      body: formData,
    });
  }

  async getPosts() {
    return this.request('/posts/');
  }

  async getPost(postId) {
    return this.request(`/posts/${postId}/`);
  }

  async deletePost(postId) {
    return this.request(`/posts/${postId}/delete/`, {
      method: 'DELETE',
    });
  }

  async getCategories() {
    return this.request('/posts/categories/');
  }
}

export const apiClient = new ApiClient();